-- Create webhook_runs table for monitoring
CREATE TABLE IF NOT EXISTS webhook_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    workflow_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    attempt INTEGER NOT NULL DEFAULT 1,
    request JSONB,
    response JSONB,
    error_code TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE IF EXISTS webhook_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view webhook runs of own submissions" ON webhook_runs;
DROP POLICY IF EXISTS "Service role can manage webhook runs" ON webhook_runs;

-- Create policies
CREATE POLICY "Users can view webhook runs of own submissions"
    ON webhook_runs 
    FOR SELECT
    USING (
        submission_id IN (
            SELECT id FROM submissions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage webhook runs"
    ON webhook_runs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create trigger
DROP TRIGGER IF EXISTS set_webhook_runs_updated_at ON webhook_runs;
CREATE TRIGGER set_webhook_runs_updated_at
    BEFORE UPDATE ON webhook_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_webhook_runs_submission_id ON webhook_runs(submission_id);
CREATE INDEX IF NOT EXISTS idx_webhook_runs_workflow_id ON webhook_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_webhook_runs_status ON webhook_runs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_runs_created_at ON webhook_runs(created_at);

-- Add rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_plan_tier plan_tier
)
RETURNS boolean AS $$
DECLARE
    v_limit INTEGER;
    v_count INTEGER;
BEGIN
    -- Set limits based on plan tier
    v_limit := CASE p_plan_tier
        WHEN 'free' THEN 10      -- 10 requests per hour for free
        WHEN 'pro' THEN 100      -- 100 requests per hour for pro
        WHEN 'enterprise' THEN 1000   -- 1000 requests per hour for enterprise
        ELSE 5                    -- Default fallback
    END;

    -- Count submissions in the last hour
    SELECT COUNT(*)
    INTO v_count
    FROM submissions
    WHERE user_id = p_user_id
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';

    -- Return true if under limit
    RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add rate limit check to submissions table
-- Add rate limit constraint only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'submissions'
      AND c.conname = 'check_submission_rate_limit'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT check_submission_rate_limit
      CHECK (check_rate_limit(user_id, plan_tier));
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE webhook_runs IS 'Monitors n8n webhook executions and tracks performance/errors';
COMMENT ON FUNCTION check_rate_limit IS 'Enforces rate limits based on user plan tier';

-- Rollback SQL
-- DROP TABLE IF EXISTS webhook_runs;
-- DROP FUNCTION IF EXISTS check_rate_limit;