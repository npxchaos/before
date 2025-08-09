# 🚀 n8n Webhook Integration Setup

## 📋 **Overview**

This guide explains how to set up automatic n8n webhook notifications when new URLs are submitted to your Supabase `submissions` table.

## 🎯 **What We're Building**

- ✅ **PostgreSQL function** `notify_n8n()` that sends HTTP POST requests
- ✅ **Database trigger** `trigger_notify_n8n` on the `submissions` table
- ✅ **Logging system** to monitor webhook success/failure
- ✅ **Configuration table** for easy webhook management
- ✅ **Test functions** for debugging and verification

## 🛠️ **Deployment Steps**

### **Step 1: Run the SQL Migrations**

1. **Open your Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the main migration:**
   ```sql
   -- Copy and paste the contents of supabase-migrations/002_create_n8n_webhook.sql
   ```

3. **Run the monitoring queries:**
   ```sql
   -- Copy and paste the contents of supabase-migrations/003_webhook_monitoring_queries.sql
   ```

4. **Run the test functions:**
   ```sql
   -- Copy and paste the contents of supabase-migrations/004_test_webhook_function.sql
   ```

### **Step 2: Verify the Setup**

Run this query to check if everything is properly configured:

```sql
SELECT * FROM check_webhook_setup();
```

You should see all components with ✅ status.

### **Step 3: Test the Webhook**

1. **Test manually:**
   ```sql
   SELECT test_n8n_webhook();
   ```

2. **Test with a real submission:**
   - Go to your application
   - Submit a URL through the form
   - Check the webhook logs

### **Step 4: Monitor the Integration**

Use these queries to monitor the webhook:

```sql
-- View recent webhook attempts
SELECT 
  event_type,
  status,
  response_status,
  created_at
FROM webhook_logs 
WHERE event_type = 'n8n_notification'
ORDER BY created_at DESC 
LIMIT 10;
```

## 📊 **Payload Format**

The webhook now sends this JSON payload to n8n:

```json
{
  "submission_id": "uuid-of-submission",
  "id": "uuid-of-submission",
  "url": "https://example.com",
  "plan_tier": "free",
  "status": "pending",
  "created_at": "2025-08-08T20:30:00.000Z",
  "updated_at": "2025-08-08T20:30:00.000Z",
  "started_at": "2025-08-08T20:30:00.000Z",
  "event_type": "submission_created",
  "timestamp": "2025-08-08T20:30:00.000Z"
}
```

## 🔧 **Configuration Management**

### **Update Webhook URL**
```sql
UPDATE webhook_config 
SET 
  webhook_url = 'https://your-new-n8n-url.com/webhook/new-id',
  updated_at = NOW()
WHERE webhook_type = 'n8n_notification';
```

### **Add Authentication (if needed)**
```sql
UPDATE webhook_config 
SET 
  api_key = 'your-api-key-here',
  updated_at = NOW()
WHERE webhook_type = 'n8n_notification';
```

### **Disable/Enable Webhook**
```sql
-- Disable temporarily
UPDATE webhook_config 
SET is_active = false 
WHERE webhook_type = 'n8n_notification';

-- Re-enable
UPDATE webhook_config 
SET is_active = true 
WHERE webhook_type = 'n8n_notification';
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"HTTP extension not available"**
   - Contact Supabase support to enable the `http` extension
   - Alternative: Use Edge Functions approach

2. **"Webhook failed with status 404"**
   - Check the webhook URL in `webhook_config` table
   - Verify the n8n webhook endpoint is active

3. **"Webhook failed with status 401/403"**
   - Add authentication headers if required
   - Update the `api_key` in `webhook_config`

4. **"No webhook logs appearing"**
   - Check if the trigger is properly created
   - Verify the `notify_n8n()` function exists

### **Debug Steps**

1. **Check webhook configuration:**
   ```sql
   SELECT * FROM webhook_config WHERE webhook_type = 'n8n_notification';
   ```

2. **View recent errors:**
   ```sql
   SELECT * FROM webhook_errors 
   WHERE webhook_type = 'n8n_notification'
   ORDER BY created_at DESC LIMIT 5;
   ```

3. **Test webhook manually:**
   ```sql
   SELECT test_n8n_webhook();
   ```

4. **Check trigger setup:**
   ```sql
   SELECT * FROM check_webhook_setup();
   ```

## 📈 **Monitoring Dashboard**

### **Success Rate**
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhook_logs 
WHERE event_type = 'n8n_notification'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;
```

### **Recent Activity**
```sql
SELECT 
  event_type,
  status,
  response_status,
  created_at,
  CASE 
    WHEN status = 'success' THEN '✅'
    WHEN status = 'failed' THEN '❌'
    ELSE '⏳'
  END as status_icon
FROM webhook_logs 
WHERE event_type = 'n8n_notification'
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔒 **Security Considerations**

- ✅ **Row Level Security (RLS)** enabled on all logging tables
- ✅ **Admin-only access** to webhook configuration and logs
- ✅ **Error handling** prevents webhook failures from breaking submissions
- ✅ **Rate limiting** already implemented in your API

## 🚀 **Production Checklist**

- [ ] HTTP extension enabled in Supabase
- [ ] Webhook URL correctly configured
- [ ] Authentication added (if required)
- [ ] Test webhook manually
- [ ] Submit test URL through form
- [ ] Verify webhook logs
- [ ] Monitor for 24 hours
- [ ] Set up alerts for webhook failures

## 📞 **Support**

If you encounter issues:

1. **Check the logs:** Use the monitoring queries above
2. **Test manually:** Use `SELECT test_n8n_webhook();`
3. **Verify setup:** Use `SELECT * FROM check_webhook_setup();`
4. **Contact support:** If issues persist

---

**🎯 Status:** Ready for deployment  
**📅 Last Updated:** 2025-08-09  
**🔗 Webhook URL:** `https://primary-production-aada.up.railway.app/webhook/orchestrator`
