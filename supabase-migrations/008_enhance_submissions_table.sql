-- Create plan_tier enum if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to submissions if they don't exist
DO $$ 
BEGIN
    -- Add plan_tier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'submissions' 
                  AND column_name = 'plan_tier') THEN
        ALTER TABLE submissions 
        ADD COLUMN plan_tier plan_tier NOT NULL DEFAULT 'free';
    END IF;

    -- Add result_lighthouse column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'submissions' 
                  AND column_name = 'result_lighthouse') THEN
        ALTER TABLE submissions 
        ADD COLUMN result_lighthouse JSONB;
    END IF;

    -- Add result_aeo column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'submissions' 
                  AND column_name = 'result_aeo') THEN
        ALTER TABLE submissions 
        ADD COLUMN result_aeo JSONB;
    END IF;

    -- Add visibility_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'submissions' 
                  AND column_name = 'visibility_score') THEN
        ALTER TABLE submissions 
        ADD COLUMN visibility_score NUMERIC;
    END IF;

    -- Add started_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'submissions' 
                  AND column_name = 'started_at') THEN
        ALTER TABLE submissions 
        ADD COLUMN started_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create visibility_snapshots table if it doesn't exist
CREATE TABLE IF NOT EXISTS visibility_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    query TEXT NOT NULL,
    engines JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on visibility_snapshots if not already enabled
ALTER TABLE IF EXISTS visibility_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view snapshots of own submissions" ON visibility_snapshots;
DROP POLICY IF EXISTS "Service role can insert snapshots" ON visibility_snapshots;

-- Create policies for visibility_snapshots
CREATE POLICY "Users can view snapshots of own submissions"
    ON visibility_snapshots 
    FOR SELECT
    USING (
        submission_id IN (
            SELECT id FROM submissions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert snapshots"
    ON visibility_snapshots 
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_updated_at ON submissions;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE visibility_snapshots IS 'Stores visibility check results for submissions across different search engines';

-- Rollback SQL
-- DROP TABLE IF EXISTS visibility_snapshots;
-- ALTER TABLE submissions 
--   DROP COLUMN IF EXISTS plan_tier,
--   DROP COLUMN IF EXISTS result_lighthouse,
--   DROP COLUMN IF EXISTS result_aeo,
--   DROP COLUMN IF EXISTS visibility_score,
--   DROP COLUMN IF EXISTS started_at;
-- DROP TYPE IF EXISTS plan_tier;