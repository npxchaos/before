-- Add user_id column to submissions table
-- This links submissions to user accounts when authenticated

-- Add user_id column
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);

-- Update RLS policies to allow users to see their own submissions
DROP POLICY IF EXISTS "Allow users to view own submissions" ON submissions;
CREATE POLICY "Allow users to view own submissions" ON submissions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id IS NULL -- Allow viewing anonymous submissions
  );

-- Allow users to update their own submissions
DROP POLICY IF EXISTS "Allow users to update own submissions" ON submissions;
CREATE POLICY "Allow users to update own submissions" ON submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own submissions
DROP POLICY IF EXISTS "Allow users to delete own submissions" ON submissions;
CREATE POLICY "Allow users to delete own submissions" ON submissions
  FOR DELETE USING (auth.uid() = user_id);
