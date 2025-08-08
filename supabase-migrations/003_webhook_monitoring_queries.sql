-- =====================================================
-- WEBHOOK MONITORING AND MANAGEMENT QUERIES
-- =====================================================

-- 1. View recent webhook logs
-- Run this to see the latest webhook attempts
SELECT 
  event_type,
  status,
  response_status,
  created_at,
  updated_at,
  CASE 
    WHEN status = 'success' THEN '✅'
    WHEN status = 'failed' THEN '❌'
    ELSE '⏳'
  END as status_icon
FROM webhook_logs 
WHERE event_type = 'n8n_notification'
ORDER BY created_at DESC 
LIMIT 10;

-- 2. View failed webhooks for debugging
-- Run this to see webhook failures
SELECT 
  id,
  webhook_type,
  error_message,
  retry_count,
  created_at
FROM webhook_errors 
WHERE webhook_type = 'n8n_notification'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check webhook configuration
-- Run this to verify your webhook settings
SELECT 
  webhook_type,
  webhook_url,
  is_active,
  retry_limit,
  timeout_seconds,
  created_at,
  updated_at
FROM webhook_config 
WHERE webhook_type = 'n8n_notification';

-- 4. Update webhook URL (if needed)
-- Uncomment and modify the URL below if you need to change it
/*
UPDATE webhook_config 
SET 
  webhook_url = 'https://your-new-n8n-url.com/webhook/new-id',
  updated_at = NOW()
WHERE webhook_type = 'n8n_notification';
*/

-- 5. Disable/Enable webhook temporarily
-- Uncomment to disable webhook
/*
UPDATE webhook_config 
SET is_active = false 
WHERE webhook_type = 'n8n_notification';
*/

-- Uncomment to re-enable webhook
/*
UPDATE webhook_config 
SET is_active = true 
WHERE webhook_type = 'n8n_notification';
*/

-- 6. Add authentication to webhook (if needed)
-- Uncomment and add your API key if n8n requires authentication
/*
UPDATE webhook_config 
SET 
  api_key = 'your-api-key-here',
  updated_at = NOW()
WHERE webhook_type = 'n8n_notification';
*/

-- 7. Test webhook manually (for debugging)
-- Run this to test the webhook function manually
/*
SELECT notify_n8n_test();
*/

-- 8. View webhook success rate
-- Run this to see webhook performance
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_logs 
WHERE event_type = 'n8n_notification'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;

-- 9. Check for recent submissions that should have triggered webhooks
-- Run this to verify submissions are being created
SELECT 
  id,
  url,
  status,
  created_at
FROM submissions 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 10. Clean up old logs (optional - run monthly)
-- Uncomment to clean up old webhook logs (older than 30 days)
/*
DELETE FROM webhook_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM webhook_errors 
WHERE created_at < NOW() - INTERVAL '30 days';
*/
