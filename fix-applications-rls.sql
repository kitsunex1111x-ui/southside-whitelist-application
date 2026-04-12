-- Fix applications table RLS issues
-- Run this if the debug script shows RLS blocking inserts

-- Option 1: Disable RLS completely (quick fix)
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;

-- Option 2: Create permissive policy (safer)
-- Uncomment these if you want to keep RLS enabled but allow inserts

-- DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;
-- CREATE POLICY "Users can insert their own applications" ON applications
-- FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Option 3: Create public access policy (most permissive)
-- DROP POLICY IF EXISTS "Public access" ON applications;
-- CREATE POLICY "Public access" ON applications
-- FOR ALL USING (true);

-- Verify the change
SELECT 'Applications RLS status updated' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'applications';
