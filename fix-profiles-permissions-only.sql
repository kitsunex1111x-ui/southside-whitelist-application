-- Simple permission fix for profiles table
-- Just grant permissions without creating new policies

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- This should be enough to fix the permission denied error
