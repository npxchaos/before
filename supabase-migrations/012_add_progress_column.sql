-- Ensure submissions.progress column exists for monitoring views and workflows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'submissions'
      AND column_name = 'progress'
  ) THEN
    ALTER TABLE submissions
      ADD COLUMN progress INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Optionally backfill existing rows to 0 (default handles it)
-- UPDATE submissions SET progress = 0 WHERE progress IS NULL;


