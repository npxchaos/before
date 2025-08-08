-- Enable the http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Create webhook logs table for monitoring
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook errors table for error tracking
CREATE TABLE IF NOT EXISTS webhook_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type TEXT NOT NULL,
  error_message TEXT,
  payload JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook configuration table
CREATE TABLE IF NOT EXISTS webhook_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_type TEXT UNIQUE NOT NULL,
  webhook_url TEXT NOT NULL,
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  retry_limit INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_errors_webhook_type ON webhook_errors(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_errors_created_at ON webhook_errors(created_at);

-- Enable RLS on logging tables
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;

-- Create policies for logging tables (admin access only)
CREATE POLICY "Allow admin access to webhook_logs" ON webhook_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin access to webhook_errors" ON webhook_errors
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin access to webhook_config" ON webhook_config
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert n8n webhook configuration
INSERT INTO webhook_config (webhook_type, webhook_url) 
VALUES (
  'n8n_notification',
  'https://primary-production-aada.up.railway.app/webhook/dfd717ed-cfe9-42c7-ba47-c935cbb5650b'
) ON CONFLICT (webhook_type) 
DO UPDATE SET 
  webhook_url = EXCLUDED.webhook_url,
  updated_at = NOW();

-- Create the PostgreSQL function to notify n8n
CREATE OR REPLACE FUNCTION notify_n8n()
RETURNS TRIGGER AS $$
DECLARE
  config_record RECORD;
  payload JSONB;
  response_status INTEGER;
  response_body TEXT;
  error_message TEXT;
BEGIN
  -- Get webhook configuration
  SELECT * INTO config_record 
  FROM webhook_config 
  WHERE webhook_type = 'n8n_notification' AND is_active = true;
  
  -- Skip if no active configuration
  IF NOT FOUND THEN
    RAISE WARNING 'No active n8n webhook configuration found';
    RETURN NEW;
  END IF;

  -- Create the payload with submission data
  payload := jsonb_build_object(
    'id', NEW.id,
    'url', NEW.url,
    'status', NEW.status,
    'created_at', NEW.created_at,
    'updated_at', NEW.updated_at,
    'event_type', 'submission_created',
    'timestamp', NOW()
  );

  -- Log the webhook attempt
  INSERT INTO webhook_logs (event_type, payload, status, created_at)
  VALUES ('n8n_notification', payload, 'pending', NOW());

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
        http_header('X-Webhook-Source', 'prompta-submissions')
      ],
      'application/json',
      payload::text
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
  WHERE event_type = 'n8n_notification' 
    AND created_at = (SELECT MAX(created_at) FROM webhook_logs WHERE event_type = 'n8n_notification');

  -- Log error if webhook failed
  IF response_status < 200 OR response_status >= 300 THEN
    error_message := format('Webhook failed with status %s: %s', response_status, response_body);
    
    -- Insert error log
    INSERT INTO webhook_errors (webhook_type, error_message, payload, created_at)
    VALUES ('n8n_notification', error_message, payload, NOW());
    
    RAISE WARNING 'n8n webhook failed: %', error_message;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the exception
    INSERT INTO webhook_errors (webhook_type, error_message, payload, created_at)
    VALUES ('n8n_notification', SQLERRM, payload, NOW());
    
    -- Don't fail the insert, just log the error
    RAISE WARNING 'Exception in notify_n8n: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically call notify_n8n on new submissions
CREATE TRIGGER trigger_notify_n8n
  AFTER INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_n8n();
