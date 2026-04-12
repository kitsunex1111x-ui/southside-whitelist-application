-- Fix RLS policies to allow admin/owner to manage all roles
-- This will let you assign owner role to your account

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;

-- Create new policies that allow admins/owners to manage all roles
CREATE POLICY "Users can view their own role" ON user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and owners can view all roles" ON user_roles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2 
    JOIN auth.users u ON ur2.user_id = u.id 
    WHERE u.id = auth.uid() 
    AND ur2.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Users can insert their own role" ON user_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and owners can insert any role" ON user_roles
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur2 
    JOIN auth.users u ON ur2.user_id = u.id 
    WHERE u.id = auth.uid() 
    AND ur2.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Users can update their own role" ON user_roles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins and owners can update any role" ON user_roles
FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur2 
    JOIN auth.users u ON ur2.user_id = u.id 
    WHERE u.id = auth.uid() 
    AND ur2.role IN ('admin', 'owner')
  )
);
