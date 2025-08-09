-- Fix: eliminate ambiguous references in notify_n8n() UPDATE by renaming variables
-- Safe to run multiple times (CREATE OR REPLACE)

CREATE OR REPLACE FUNCTION notify_n8n()
RETURNS TRIGGER AS $$
DECLARE
  v_config RECORD;
  v_payload JSONB;
  v_status_code INTEGER;
  v_response_body TEXT;
  v_headers http_header[];
BEGIN
  SELECT * INTO v_config
  FROM webhook_config
  WHERE webhook_type = 'n8n_notification' AND is_active = true;

  IF NOT FOUND THEN
    RAISE WARNING 'No active n8n webhook configuration found';
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'submission_id', NEW.id,
    'id', NEW.id,
    'url', NEW.url,
    'plan_tier', NEW.plan_tier,
    'status', NEW.status,
    'created_at', NEW.created_at,
    'updated_at', NEW.updated_at,
    'started_at', NOW(),
    'event_type', 'submission_created',
    'timestamp', NOW()
  );

  INSERT INTO webhook_logs (event_type, payload, status, created_at)
  VALUES ('n8n_notification', v_payload, 'pending', NOW());

  v_headers := ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('User-Agent', 'Supabase-Webhook/1.0'),
    http_header('X-Webhook-Source', 'prompta-submissions')
  ];

  IF v_config.api_key IS NOT NULL THEN
    v_headers := v_headers || http_header('Authorization', 'Bearer ' || v_config.api_key);
  END IF;

  SELECT status, content
    INTO v_status_code, v_response_body
  FROM http((
    'POST',
    v_config.webhook_url,
    v_headers,
    'application/json',
    v_payload::text
  ));

  UPDATE webhook_logs
  SET
    status = CASE WHEN v_status_code BETWEEN 200 AND 299 THEN 'success' ELSE 'failed' END,
    response_status = v_status_code,
    response_body = v_response_body,
    updated_at = NOW()
  WHERE event_type = 'n8n_notification'
    AND created_at = (
      SELECT MAX(created_at) FROM webhook_logs WHERE event_type = 'n8n_notification'
    );

  IF v_status_code < 200 OR v_status_code >= 300 THEN
    INSERT INTO webhook_errors (webhook_type, error_message, payload, created_at)
    VALUES (
      'n8n_notification',
      format('Webhook failed with status %s: %s', v_status_code, v_response_body),
      v_payload,
      NOW()
    );
    RAISE WARNING 'n8n webhook failed with status % and body: %', v_status_code, v_response_body;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO webhook_errors (webhook_type, error_message, payload, created_at)
    VALUES ('n8n_notification', SQLERRM, v_payload, NOW());
    RAISE WARNING 'Exception in notify_n8n: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


