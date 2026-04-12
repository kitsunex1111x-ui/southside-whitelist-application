-- Fix RLS policies for applications table to allow admins to read applications
-- This will fix the admin dashboard not showing submitted applications

-- First, let's check current policies
SELECT * FROM pg_policies WHERE tablename = 'applications';

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;

-- Create new RLS policies for applications
-- 1. Allow users to insert their own applications
CREATE POLICY "Users can insert own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to view their own applications
CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Allow admins to view all applications
CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 4. Allow admins to update all applications
CREATE POLICY "Admins can update all applications" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 5. Allow admins to delete all applications
CREATE POLICY "Admins can delete all applications" ON public.applications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Verify policies are created
SELECT * FROM pg_policies WHERE tablename = 'applications';

-- Test query to verify admin can read applications
-- This should return all applications for admin users
SELECT 
  id, 
  user_id, 
  real_name, 
  discord, 
  status, 
  created_at 
FROM public.applications 
ORDER BY created_at DESC 
LIMIT 5;
