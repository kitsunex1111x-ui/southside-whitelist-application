-- Comprehensive owner role assignment with full diagnostics
-- This script will diagnose and fix all potential issues

-- Step 1: Check if user exists by Discord ID
SELECT 'Step 1: Finding user by Discord ID' as step;
SELECT id, email, raw_user_meta_data, app_metadata
FROM auth.users
WHERE raw_user_meta_data->>'provider_id' = '1266017433010045059' 
   OR raw_user_meta_data->>'discord_id' = '1266017433010045059'
   OR app_metadata->>'provider_id' = '1266017433010045059'
   OR app_metadata->>'discord_id' = '1266017433010045059';

-- Step 2: Check if user exists by email (backup method)
SELECT 'Step 2: Finding user by email (backup)' as step;
SELECT id, email, raw_user_meta_data, app_metadata
FROM auth.users
WHERE email = 'kitsuenx1111x@gmail.com';

-- Step 3: Check current user_roles table structure
SELECT 'Step 3: Checking user_roles table' as step;
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'user_roles';

-- Step 4: Check existing roles for this user (if any)
SELECT 'Step 4: Current roles for user' as step;
SELECT ur.role, ur.user_id, u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'kitsuenx1111x@gmail.com';

-- Step 5: Temporarily disable RLS for this operation (Dashboard bypass)
SELECT 'Step 5: Disabling RLS temporarily' as step;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Step 6: Insert owner role (replace UUID after finding user)
-- IMPORTANT: Run the SELECT queries first, get your UUID, then replace below

-- AFTER you get your user ID from Step 1 or 2, replace 'YOUR_UUID_HERE' with it:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_UUID_HERE', 'owner')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner', updated_at = NOW();

-- Step 7: Re-enable RLS
SELECT 'Step 7: Re-enabling RLS' as step;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 8: Verify final assignment
SELECT 'Step 8: Final verification' as step;
SELECT ur.role, ur.user_id, u.email, u.raw_user_meta_data
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'kitsuenx1111x@gmail.com' 
   OR u.raw_user_meta_data->>'provider_id' = '1266017433010045059' 
   OR u.raw_user_meta_data->>'discord_id' = '1266017433010045059';
