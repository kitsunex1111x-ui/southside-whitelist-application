-- Simple fix for RLS policies - just grant permissions
-- This fixes the "permission denied for table profiles" error

-- Grant necessary permissions (this is what's actually needed)
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- If policies already exist, this should be enough to fix the issue
