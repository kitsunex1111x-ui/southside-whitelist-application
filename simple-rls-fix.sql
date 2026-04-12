-- Simple RLS fix - avoid circular reference
-- Use user metadata instead of querying user_roles table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;

-- Simple policies using user metadata
CREATE POLICY "Users can view their own role" ON user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and owners can view all roles" ON user_roles
FOR SELECT USING (
  auth.uid() = user_id OR
  raw_user_meta_data->>'role' IN ('admin', 'owner')
);

CREATE POLICY "Users can insert their own role" ON user_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and owners can insert any role" ON user_roles
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  raw_user_meta_data->>'role' IN ('admin', 'owner')
);

CREATE POLICY "Users can update their own role" ON user_roles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins and owners can update any role" ON user_roles
FOR UPDATE USING (
  auth.uid() = user_id OR
  raw_user_meta_data->>'role' IN ('admin', 'owner')
);
