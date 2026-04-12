-- Comprehensive debug for Submit Application issues
-- Run this in Supabase SQL Editor to identify problems

-- Step 1: Check if applications table exists
SELECT 'Step 1: Check applications table exists' as step;
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'applications';

-- Step 2: Check applications table structure
SELECT 'Step 2: Check applications table structure' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;

-- Step 3: Check if RLS is enabled on applications table
SELECT 'Step 3: Check RLS status' as step;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'applications';

-- Step 4: Check existing RLS policies on applications table
SELECT 'Step 4: Check existing RLS policies' as step;
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'applications';

-- Step 5: Test if current user can insert into applications
SELECT 'Step 5: Test INSERT permission' as step;
SELECT auth.uid() as current_user_id;

-- Step 6: Try a test insert (this will show if RLS blocks it)
SELECT 'Step 6: Test INSERT operation' as step;
-- This will fail if RLS blocks the operation
-- You can run this manually to see the exact error:
-- INSERT INTO public.applications (user_id, real_name, discord, age, rdm, vdm, metagaming, powergaming, char_name, backstory, traits)
-- VALUES (auth.uid(), 'Test User', '123456789012345678', '25', 'Test RDM', 'Test VDM', 'Test Meta', 'Test Power', 'Test Char', 'Test Backstory', 'Test Traits');

-- Step 7: Check if user_roles table exists and has your role
SELECT 'Step 7: Check user_roles and your role' as step;
SELECT ur.role, ur.user_id, u.email 
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'kitsuenx1111x@gmail.com' 
   OR u.raw_user_meta_data->>'provider_id' = '1266017433010045059'
   OR u.raw_user_meta_data->>'discord_id' = '1266017433010045059';

-- Step 8: Check if you need to disable RLS temporarily
SELECT 'Step 8: RLS Status Summary' as step;
SELECT 'If Step 6 fails, run: ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;' as recommendation;
