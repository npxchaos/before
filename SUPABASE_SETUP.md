# 🚀 Supabase Integration Setup

## 📋 **Overview**

This guide explains how to set up the Supabase integration for the Prompta URL submission form.

## 🗄️ **Database Setup**

### 1. Create the Submissions Table

Run the following SQL in your Supabase SQL Editor:

```sql
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
```

### 2. Verify Environment Variables

Ensure your `.env` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🧪 **Testing the Integration**

### 1. Start the Development Server

```bash
pnpm dev
```

### 2. Test URL Submission

1. Navigate to `http://localhost:3001`
2. Enter a valid URL (e.g., `https://example.com`)
3. Click the submit button
4. Check the browser's Network tab to see the API response
5. Verify the data is saved in Supabase Dashboard

### 3. Check Database

In your Supabase Dashboard:
1. Go to **Table Editor**
2. Select the `submissions` table
3. Verify new records are being created

## 🔧 **API Endpoint Details**

### **POST /api/submit-url**

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "URL submitted successfully!",
  "data": {
    "id": "uuid-here",
    "url": "https://example.com",
    "status": "pending",
    "createdAt": "2025-08-08T20:30:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message here"
}
```

## 🛡️ **Security Features**

### **Rate Limiting**
- 5 submissions per minute per IP
- Prevents spam and API abuse

### **Input Validation**
- URL format validation
- Required field checking
- XSS protection

### **Row Level Security (RLS)**
- Anonymous inserts allowed
- Public read access
- Update permissions for status changes

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Failed to save URL to database"**
   - Check Supabase connection
   - Verify environment variables
   - Check RLS policies

2. **"Method not allowed"**
   - Ensure you're using POST method
   - Check API route configuration

3. **Rate limiting errors**
   - Wait 1 minute before retrying
   - Check IP address detection

### **Debug Steps**

1. **Check Environment Variables:**
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Test Supabase Connection:**
   ```javascript
   // In browser console
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
   ```

3. **Check Database Logs:**
   - Go to Supabase Dashboard
   - Check Logs section for errors

## 📊 **Monitoring**

### **Database Metrics**
- Track submission volume
- Monitor error rates
- Check performance

### **API Metrics**
- Response times
- Success/failure rates
- Rate limiting hits

## 🚀 **Next Steps**

1. **Add User Authentication**
   - Link submissions to user accounts
   - Add user-specific RLS policies

2. **Implement Status Updates**
   - Add background job processing
   - Update submission status

3. **Add Analytics**
   - Track popular URLs
   - Monitor submission patterns

---

**📝 Last Updated:** 2025-08-08  
**👤 Created By:** AI Assistant  
**🎯 Status:** ✅ **Ready for Testing**
