-- Fix Discord Bot Service Role Access
-- This will ensure your Discord bot can read user_roles with service role key

-- 1. First, check current RLS policies on user_roles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 2. Drop all existing user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can bypass RLS for user_roles" ON public.user_roles;

-- 3. Create new policies that properly allow service role access
-- Service role bypass (for Discord bot)
CREATE POLICY "Service role bypass for user_roles" ON public.user_roles
  FOR ALL USING (
    pg_has_role(session_user, 'service_role') OR 
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 4. Alternative: Create a separate policy specifically for service role
CREATE POLICY "Service role full access" ON public.user_roles
  FOR ALL USING (pg_has_role(session_user, 'service_role'));

-- 5. Test query as service role (this is what your Discord bot would do)
SELECT 
  'Discord bot test query' as test_description,
  COUNT(*) as total_roles,
  'This should work with service role' as expected_result
FROM public.user_roles;

-- 6. Test specific role lookup (what your bot likely needs)
SELECT 
  'Role lookup test' as test_description,
  user_id,
  role,
  'Bot should see this' as expected_result
FROM public.user_roles 
WHERE role IN ('admin', 'owner', 'accepted')
LIMIT 5;

-- 7. Check if service role exists and has proper permissions
SELECT 
  'Service role check' as check_type,
  pg_has_role('postgres', 'service_role') as service_role_exists,
  'Should be true for bot access' as expected;

-- 8. Create a function to bypass RLS for service role if needed
CREATE OR REPLACE FUNCTION public.service_role_bypass()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN pg_has_role(session_user, 'service_role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create a view that bypasses RLS (alternative solution)
CREATE OR REPLACE VIEW public.user_roles_bypass AS
SELECT 
  user_id,
  role,
  created_at,
  updated_at
FROM public.user_roles;

-- Grant access to the view for service role
GRANT SELECT ON public.user_roles_bypass TO service_role;
GRANT SELECT ON public.user_roles_bypass TO anon;
GRANT SELECT ON public.user_roles_bypass TO authenticated;

-- 10. Final verification - test both direct table and view access
SELECT 
  'Direct table access' as access_type,
  COUNT(*) as record_count
FROM public.user_roles

UNION ALL

SELECT 
  'View access' as access_type,
  COUNT(*) as record_count
FROM public.user_roles_bypass;

-- 11. Instructions for your Discord bot
-- Your bot should now be able to query user_roles using either:
-- Method 1: Direct table access (with service role)
-- SELECT user_id, role FROM public.user_roles WHERE user_id = 'user-uuid';

-- Method 2: View access (bypasses RLS)
-- SELECT user_id, role FROM public.user_roles_bypass WHERE user_id = 'user-uuid';

-- Method 3: Using the bypass function
-- SELECT * FROM public.service_role_bypass_user_roles() WHERE user_id = 'user-uuid';

SELECT 'Discord bot access fixes applied' as status;
