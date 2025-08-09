-- Create alert_severity enum
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error', 'critical');

-- Create alert_status enum
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved');

-- Create monitoring_alerts table
CREATE TABLE monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'active',
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create monitoring_metrics table for time-series data
CREATE TABLE monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    labels JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_alerts_status ON monitoring_alerts(status);
CREATE INDEX idx_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX idx_alerts_type ON monitoring_alerts(type);
CREATE INDEX idx_alerts_created_at ON monitoring_alerts(created_at);
CREATE INDEX idx_metrics_name ON monitoring_metrics(metric_name);
CREATE INDEX idx_metrics_timestamp ON monitoring_metrics(timestamp);

-- Create function to check error rates
CREATE OR REPLACE FUNCTION check_error_rates()
RETURNS void AS $$
DECLARE
    error_rate NUMERIC;
    error_threshold NUMERIC := 0.1; -- 10% error rate threshold
BEGIN
    -- Calculate error rate for the last 5 minutes
    WITH recent_runs AS (
        SELECT 
            COUNT(*) as total_runs,
            COUNT(*) FILTER (WHERE status = 'failed') as failed_runs
        FROM webhook_runs
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
        AND created_at <= CURRENT_TIMESTAMP
    )
    SELECT COALESCE(failed_runs::NUMERIC / NULLIF(total_runs, 0), 0)
    INTO error_rate
    FROM recent_runs;

    -- Create alert if error rate is too high
    IF error_rate > error_threshold THEN
        INSERT INTO monitoring_alerts (
            severity,
            type,
            message,
            details
        ) VALUES (
            'critical',
            'high_error_rate',
            'High webhook failure rate detected',
            jsonb_build_object(
                'error_rate', error_rate,
                'threshold', error_threshold,
                'window', '5 minutes'
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check for stuck submissions
CREATE OR REPLACE FUNCTION check_stuck_submissions()
RETURNS void AS $$
DECLARE
    stuck_time INTERVAL := INTERVAL '15 minutes';
BEGIN
    -- Find submissions that started but haven't completed
    INSERT INTO monitoring_alerts (
        severity,
        type,
        message,
        details
    )
    SELECT 
        'warning',
        'stuck_submission',
        'Submission processing exceeded time limit',
        jsonb_build_object(
            'submission_id', id,
            'url', url,
            'status', status,
            'progress', progress,
            'started_at', started_at
        )
    FROM submissions
    WHERE status = 'processing'
    AND started_at < CURRENT_TIMESTAMP - stuck_time
    AND NOT EXISTS (
        SELECT 1 FROM monitoring_alerts
        WHERE type = 'stuck_submission'
        AND status = 'active'
        AND (details->>'submission_id')::UUID = submissions.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check rate limit usage
CREATE OR REPLACE FUNCTION check_rate_limit_usage()
RETURNS void AS $$
DECLARE
    usage_threshold NUMERIC := 0.8; -- 80% of limit
    r RECORD;
BEGIN
    -- Check usage per user and plan
    FOR r IN
        SELECT 
            user_id,
            plan_tier,
            COUNT(*) as request_count,
            CASE plan_tier
                WHEN 'free' THEN 10
                WHEN 'pro' THEN 100
                WHEN 'enterprise' THEN 1000
            END as limit
        FROM submissions
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        GROUP BY user_id, plan_tier
    LOOP
        -- Alert if usage is above threshold
        IF r.request_count::NUMERIC / r.limit > usage_threshold THEN
            INSERT INTO monitoring_alerts (
                severity,
                type,
                message,
                details
            ) VALUES (
                'warning',
                'high_rate_limit_usage',
                'User approaching rate limit',
                jsonb_build_object(
                    'user_id', r.user_id,
                    'plan_tier', r.plan_tier,
                    'usage', r.request_count,
                    'limit', r.limit,
                    'usage_percent', (r.request_count::NUMERIC / r.limit * 100)::INTEGER
                )
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record performance metrics
CREATE OR REPLACE FUNCTION record_performance_metrics()
RETURNS void AS $$
BEGIN
    -- Record average processing time
    INSERT INTO monitoring_metrics (
        metric_name,
        metric_value,
        labels
    )
    SELECT 
        'avg_processing_time',
        AVG(duration_ms),
        jsonb_build_object(
            'workflow_name', workflow_name,
            'status', status
        )
    FROM webhook_runs
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    GROUP BY workflow_name, status;

    -- Record success rate
    INSERT INTO monitoring_metrics (
        metric_name,
        metric_value,
        labels
    )
    SELECT 
        'success_rate',
        (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*) * 100),
        jsonb_build_object(
            'workflow_name', workflow_name
        )
    FROM webhook_runs
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    GROUP BY workflow_name;

    -- Record throughput
    INSERT INTO monitoring_metrics (
        metric_name,
        metric_value,
        labels
    )
    SELECT 
        'requests_per_minute',
        COUNT(*)::NUMERIC / 5,
        jsonb_build_object(
            'workflow_name', workflow_name,
            'status', status
        )
    FROM webhook_runs
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    GROUP BY workflow_name, status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create monitoring triggers
CREATE OR REPLACE FUNCTION process_webhook_run_monitoring()
RETURNS TRIGGER AS $$
BEGIN
    -- Record metrics
    PERFORM record_performance_metrics();
    
    -- Check error rates
    IF NEW.status = 'failed' THEN
        PERFORM check_error_rates();
    END IF;

    -- Check for stuck submissions
    IF NEW.status = 'failed' THEN
        PERFORM check_stuck_submissions();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for webhook_runs
DROP TRIGGER IF EXISTS monitor_webhook_runs ON webhook_runs;
CREATE TRIGGER monitor_webhook_runs
    AFTER INSERT OR UPDATE ON webhook_runs
    FOR EACH ROW
    EXECUTE FUNCTION process_webhook_run_monitoring();

-- Create trigger for rate limit monitoring
CREATE OR REPLACE FUNCTION process_submission_monitoring()
RETURNS TRIGGER AS $$
BEGIN
    -- Check rate limit usage
    PERFORM check_rate_limit_usage();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for submissions
DROP TRIGGER IF EXISTS monitor_submissions ON submissions;
CREATE TRIGGER monitor_submissions
    AFTER INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION process_submission_monitoring();

-- Add RLS policies
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for alerts
CREATE POLICY "Allow service role full access to alerts"
    ON monitoring_alerts
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow admins to view alerts"
    ON monitoring_alerts FOR SELECT
    USING (auth.role() = 'admin');

CREATE POLICY "Allow admins to acknowledge alerts"
    ON monitoring_alerts FOR UPDATE
    USING (auth.role() = 'admin')
    WITH CHECK (
        status IN ('acknowledged', 'resolved') AND
        auth.role() = 'admin'
    );

-- Policies for metrics
CREATE POLICY "Allow service role full access to metrics"
    ON monitoring_metrics
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow admins to view metrics"
    ON monitoring_metrics FOR SELECT
    USING (auth.role() = 'admin');

-- Add comments
COMMENT ON TABLE monitoring_alerts IS 'Stores system alerts and their status';
COMMENT ON TABLE monitoring_metrics IS 'Stores time-series metrics data';
COMMENT ON FUNCTION check_error_rates() IS 'Monitors webhook error rates and creates alerts';
COMMENT ON FUNCTION check_stuck_submissions() IS 'Identifies and alerts on stuck submissions';
COMMENT ON FUNCTION check_rate_limit_usage() IS 'Monitors rate limit usage per user';
COMMENT ON FUNCTION record_performance_metrics() IS 'Records various performance metrics';

-- Rollback SQL
-- DROP TABLE IF EXISTS monitoring_alerts;
-- DROP TABLE IF EXISTS monitoring_metrics;
-- DROP TYPE IF EXISTS alert_severity;
-- DROP TYPE IF EXISTS alert_status;
-- DROP FUNCTION IF EXISTS check_error_rates();
-- DROP FUNCTION IF EXISTS check_stuck_submissions();
-- DROP FUNCTION IF EXISTS check_rate_limit_usage();
-- DROP FUNCTION IF EXISTS record_performance_metrics();
-- DROP FUNCTION IF EXISTS process_webhook_run_monitoring();
-- DROP FUNCTION IF EXISTS process_submission_monitoring();
