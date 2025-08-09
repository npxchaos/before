-- Align DB → n8n notify payload and auth with new Orchestrator; allow 'succeeded' status

-- 1) Point webhook config to the new Orchestrator endpoint
UPDATE webhook_config
SET webhook_url = 'https://primary-production-aada.up.railway.app/webhook/orchestrator',
    updated_at = NOW()
WHERE webhook_type = 'n8n_notification';

-- NOTE: If you want header auth, set an API key:
--   UPDATE webhook_config SET api_key = 'your-secret-key', updated_at = NOW()
--   WHERE webhook_type = 'n8n_notification';

-- 2) Allow 'succeeded' as a valid status used by 4_Result_Aggregator workflow
DO $$
BEGIN
  -- Drop existing unnamed status check constraint if present and recreate
  BEGIN
    ALTER TABLE submissions DROP CONSTRAINT submissions_status_check;
  EXCEPTION
    WHEN undefined_object THEN
      NULL;
  END;

  ALTER TABLE submissions
    ADD CONSTRAINT submissions_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'succeeded', 'failed'));
END $$;

-- 3) Replace notify_n8n() to send fields expected by new Orchestrator and optional Authorization header
CREATE OR REPLACE FUNCTION notify_n8n()
RETURNS TRIGGER AS $$
DECLARE
  config_record RECORD;
  payload JSONB;
  response_status INTEGER;
  response_body TEXT;
  headers http_header[];
BEGIN
  -- Active config
  SELECT * INTO config_record
  FROM webhook_config
  WHERE webhook_type = 'n8n_notification' AND is_active = true;

  IF NOT FOUND THEN
    RAISE WARNING 'No active n8n webhook configuration found';
    RETURN NEW;
  END IF;

  -- Build payload expected by Orchestrator
  payload := jsonb_build_object(
    'submission_id', NEW.id,
    'id', NEW.id,                    -- kept for backward compatibility
    'url', NEW.url,
    'plan_tier', NEW.plan_tier,      -- defaults to 'free' if not set
    'status', NEW.status,
    'created_at', NEW.created_at,
    'updated_at', NEW.updated_at,
    'started_at', NOW(),             -- provide a start timestamp for duration calcs in workflows
    'event_type', 'submission_created',
    'timestamp', NOW()
  );

  -- Log the webhook attempt (pending)
  INSERT INTO webhook_logs (event_type, payload, status, created_at)
  VALUES ('n8n_notification', payload, 'pending', NOW());

  -- Base headers
  headers := ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('User-Agent', 'Supabase-Webhook/1.0'),
    http_header('X-Webhook-Source', 'prompta-submissions')
  ];

  -- Optional Authorization header if api_key configured
  IF config_record.api_key IS NOT NULL THEN
    headers := headers || http_header('Authorization', 'Bearer ' || config_record.api_key);
  END IF;

  -- POST to n8n
  SELECT status, content
    INTO response_status, response_body
  FROM http((
    'POST',
    config_record.webhook_url,
    headers,
    'application/json',
    payload::text
  ));

  -- Update webhook_logs with result
  UPDATE webhook_logs
  SET
    status = CASE WHEN response_status BETWEEN 200 AND 299 THEN 'success' ELSE 'failed' END,
    response_status = response_status,
    response_body = response_body,
    updated_at = NOW()
  WHERE event_type = 'n8n_notification'
    AND created_at = (
      SELECT MAX(created_at) FROM webhook_logs WHERE event_type = 'n8n_notification'
    );

  IF response_status < 200 OR response_status >= 300 THEN
    INSERT INTO webhook_errors (webhook_type, error_message, payload, created_at)
    VALUES ('n8n_notification',
            format('Webhook failed with status %s: %s', response_status, response_body),
            payload,
            NOW());
    RAISE WARNING 'n8n webhook failed with status % and body: %', response_status, response_body;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO webhook_errors (webhook_type, error_message, payload, created_at)
    VALUES ('n8n_notification', SQLERRM, payload, NOW());
    RAISE WARNING 'Exception in notify_n8n: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


