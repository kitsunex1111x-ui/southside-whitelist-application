-- Make site public access - remove RLS restrictions temporarily
-- This will allow anyone to access the site without role restrictions

-- Option 1: Disable RLS completely (temporary fix)
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Option 2: Create public access policy (safer approach)
DROP POLICY IF EXISTS "Public access" ON user_roles;
CREATE POLICY "Public access" ON user_roles
FOR ALL USING (true);

-- Option 3: Remove all existing policies (most permissive)
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins and owners can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins and owners can insert any role" ON user_roles;
DROP POLICY IF EXISTS "Admins and owners can update any role" ON user_roles;

-- Test if access works after changes
SELECT 'RLS policies updated - public access enabled' as status;
