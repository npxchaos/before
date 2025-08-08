-- Test function to manually trigger the n8n webhook
-- This is useful for testing the webhook without creating a new submission
CREATE OR REPLACE FUNCTION test_n8n_webhook()
RETURNS TEXT AS $$
DECLARE
  test_payload JSONB;
  config_record RECORD;
  response_status INTEGER;
  response_body TEXT;
BEGIN
  -- Get webhook configuration
  SELECT * INTO config_record 
  FROM webhook_config 
  WHERE webhook_type = 'n8n_notification' AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 'ERROR: No active n8n webhook configuration found';
  END IF;

  -- Create a test payload
  test_payload := jsonb_build_object(
    'id', gen_random_uuid(),
    'url', 'https://test.example.com',
    'status', 'pending',
    'created_at', NOW(),
    'updated_at', NOW(),
    'event_type', 'test_webhook',
    'timestamp', NOW()
  );

  -- Log the test attempt
  INSERT INTO webhook_logs (event_type, payload, status, created_at)
  VALUES ('n8n_notification_test', test_payload, 'pending', NOW());

  -- Make HTTP POST request to n8n webhook
  SELECT 
    status,
    content
  INTO 
    response_status,
    response_body
  FROM 
    http((
      'POST',
      config_record.webhook_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('User-Agent', 'Supabase-Webhook/1.0'),
        http_header('X-Webhook-Source', 'prompta-submissions-test')
      ],
      'application/json',
      test_payload::text
    ));

  -- Update webhook log with response
  UPDATE webhook_logs 
  SET 
    status = CASE 
      WHEN response_status >= 200 AND response_status < 300 THEN 'success'
      ELSE 'failed'
    END,
    response_status = response_status,
    response_body = response_body,
    updated_at = NOW()
  WHERE event_type = 'n8n_notification_test' 
    AND created_at = (SELECT MAX(created_at) FROM webhook_logs WHERE event_type = 'n8n_notification_test');

  -- Return result
  IF response_status >= 200 AND response_status < 300 THEN
    RETURN format('SUCCESS: Webhook sent successfully (Status: %s)', response_status);
  ELSE
    RETURN format('FAILED: Webhook failed (Status: %s, Response: %s)', response_status, response_body);
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN format('ERROR: Exception occurred - %s', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if the trigger is properly set up
CREATE OR REPLACE FUNCTION check_webhook_setup()
RETURNS TABLE(
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check if http extension is enabled
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
    RETURN QUERY SELECT 'HTTP Extension'::TEXT, '✅ Enabled'::TEXT, 'Extension is available'::TEXT;
  ELSE
    RETURN QUERY SELECT 'HTTP Extension'::TEXT, '❌ Missing'::TEXT, 'Extension not found'::TEXT;
  END IF;

  -- Check if webhook config exists
  IF EXISTS (SELECT 1 FROM webhook_config WHERE webhook_type = 'n8n_notification') THEN
    RETURN QUERY SELECT 'Webhook Config'::TEXT, '✅ Configured'::TEXT, 'Configuration found'::TEXT;
  ELSE
    RETURN QUERY SELECT 'Webhook Config'::TEXT, '❌ Missing'::TEXT, 'Configuration not found'::TEXT;
  END IF;

  -- Check if function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_n8n') THEN
    RETURN QUERY SELECT 'Notify Function'::TEXT, '✅ Created'::TEXT, 'Function exists'::TEXT;
  ELSE
    RETURN QUERY SELECT 'Notify Function'::TEXT, '❌ Missing'::TEXT, 'Function not found'::TEXT;
  END IF;

  -- Check if trigger exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_notify_n8n' 
    AND tgrelid = 'submissions'::regclass
  ) THEN
    RETURN QUERY SELECT 'Database Trigger'::TEXT, '✅ Active'::TEXT, 'Trigger is set up'::TEXT;
  ELSE
    RETURN QUERY SELECT 'Database Trigger'::TEXT, '❌ Missing'::TEXT, 'Trigger not found'::TEXT;
  END IF;

  -- Check if logging tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_logs') THEN
    RETURN QUERY SELECT 'Logging Tables'::TEXT, '✅ Created'::TEXT, 'Tables exist'::TEXT;
  ELSE
    RETURN QUERY SELECT 'Logging Tables'::TEXT, '❌ Missing'::TEXT, 'Tables not found'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;
