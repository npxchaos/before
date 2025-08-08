-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for the form submissions)
CREATE POLICY "Allow anonymous inserts" ON submissions
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anonymous reads (for public access)
CREATE POLICY "Allow anonymous reads" ON submissions
  FOR SELECT USING (true);

-- Create policy to allow updates (for status changes)
CREATE POLICY "Allow anonymous updates" ON submissions
  FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing (optional)
INSERT INTO submissions (url, status) VALUES
  ('https://example.com', 'completed'),
  ('https://test.com', 'pending')
ON CONFLICT DO NOTHING;
