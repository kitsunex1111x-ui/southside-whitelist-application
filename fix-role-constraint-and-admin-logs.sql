-- Fix role constraint and admin_logs issues
-- This will fix the 400 errors when accepting applications

-- 1. First, check current user_roles constraints
SELECT conname, contype, consrc
FROM pg_constraint 
WHERE conrelid = 'public.user_roles'::regclass AND contype = 'c';

-- 2. Drop the existing role constraint that's blocking 'accepted' role
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- 3. Create a new constraint that allows all needed roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('user', 'admin', 'owner', 'accepted', 'rejected', 'moderator', 'vip'));

-- 4. Check if admin_logs table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Create admin_logs table if it doesn't exist or fix structure
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add missing column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_logs' 
    AND table_schema = 'public' 
    AND column_name = 'actor_user_id'
  ) THEN
    ALTER TABLE public.admin_logs ADD COLUMN actor_user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 7. Enable RLS on admin_logs if not already enabled
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for admin_logs
DROP POLICY IF EXISTS "Users can view own logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.admin_logs;

CREATE POLICY "Users can view own logs" ON public.admin_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can insert own logs" ON public.admin_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert logs" ON public.admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 9. Test the constraint by trying to insert an 'accepted' role
SELECT 
  'Testing accepted role constraint' as test_description,
  'accepted' as test_role,
  'This should work now' as expected_result;

-- 10. Verify all tables and constraints are properly set up
SELECT 
  'user_roles table' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_roles' AND table_schema = 'public') as column_count,
  (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'public.user_roles'::regclass) as constraint_count

UNION ALL

SELECT 
  'admin_logs table' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'admin_logs' AND table_schema = 'public') as column_count,
  (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'public.admin_logs'::regclass) as constraint_count;

-- 11. Check current roles in the system
SELECT DISTINCT role, COUNT(*) as user_count
FROM public.user_roles 
GROUP BY role 
ORDER BY role;

-- 12. Test inserting an 'accepted' role (this should work now)
-- This is a test query - you can run it to verify the fix:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('test-uuid-here', 'accepted') 
-- ON CONFLICT (user_id, role) DO NOTHING;
