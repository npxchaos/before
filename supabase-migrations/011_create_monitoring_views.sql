-- Monitoring Views for Dashboards

-- Active alerts summary by severity and type
CREATE OR REPLACE VIEW v_alerts_summary AS
SELECT
  severity,
  type,
  COUNT(*) AS active_count,
  MIN(created_at) AS first_seen,
  MAX(created_at) AS last_seen
FROM monitoring_alerts
WHERE status = 'active'
GROUP BY severity, type
ORDER BY severity, type;

COMMENT ON VIEW v_alerts_summary IS 'Summarizes active alerts by severity and type';

-- Webhook run metrics over the last 1 hour, per workflow
CREATE OR REPLACE VIEW v_webhook_run_metrics_last_1h AS
WITH runs AS (
  SELECT * FROM webhook_runs
  WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
)
SELECT
  workflow_name,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_runs,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
  ROUND(
    CASE WHEN COUNT(*) = 0 THEN 0
         ELSE (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*) * 100)
    END, 2
  ) AS success_rate_pct,
  ROUND(AVG(NULLIF(duration_ms, 0))::NUMERIC, 2) AS avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY NULLIF(duration_ms, 0)) AS p95_duration_ms
FROM runs
GROUP BY workflow_name
ORDER BY workflow_name;

COMMENT ON VIEW v_webhook_run_metrics_last_1h IS 'Webhook run metrics (last 1h): totals, success rate, avg and p95 duration';

-- Rate limit usage by user (last 1 hour)
CREATE OR REPLACE VIEW v_rate_limit_usage_last_1h AS
WITH usage AS (
  SELECT user_id, plan_tier, COUNT(*) AS request_count
  FROM submissions
  WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
  GROUP BY user_id, plan_tier
)
SELECT
  u.user_id,
  u.plan_tier,
  u.request_count,
  CASE u.plan_tier
    WHEN 'free' THEN 10
    WHEN 'pro' THEN 100
    WHEN 'enterprise' THEN 1000
    ELSE 5
  END AS plan_limit,
  ROUND(
    (u.request_count::NUMERIC /
      CASE u.plan_tier
        WHEN 'free' THEN 10
        WHEN 'pro' THEN 100
        WHEN 'enterprise' THEN 1000
        ELSE 5
      END) * 100, 2
  ) AS usage_percent
FROM usage u
ORDER BY usage_percent DESC;

COMMENT ON VIEW v_rate_limit_usage_last_1h IS 'Rate limit usage per user and plan tier (last 1h)';

-- Stuck submissions (processing longer than 15 minutes)
CREATE OR REPLACE VIEW v_stuck_submissions AS
SELECT
  id AS submission_id,
  user_id,
  url,
  status,
  progress,
  started_at,
  (CURRENT_TIMESTAMP - started_at) AS processing_duration
FROM submissions
WHERE status = 'processing'
  AND started_at IS NOT NULL
  AND started_at < CURRENT_TIMESTAMP - INTERVAL '15 minutes'
ORDER BY started_at ASC;

COMMENT ON VIEW v_stuck_submissions IS 'Submissions stuck in processing beyond 15 minutes';

-- Rollback
-- DROP VIEW IF EXISTS v_alerts_summary;
-- DROP VIEW IF EXISTS v_webhook_run_metrics_last_1h;
-- DROP VIEW IF EXISTS v_rate_limit_usage_last_1h;
-- DROP VIEW IF EXISTS v_stuck_submissions;


