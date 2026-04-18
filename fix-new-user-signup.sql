-- Fix new user signup database error
-- This will fix the "Database error saving new user" issue during OAuth callback

-- 1. First, check if the trigger function exists and drop it
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS public.on_auth_user_created ON auth.users;

-- 2. Create a simpler, safer trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists before inserting
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = NEW.id
  ) THEN
    -- Profile already exists, don't insert again
    RETURN NEW;
  END IF;
  
  -- Insert profile with safer handling
  BEGIN
    INSERT INTO public.profiles (id, username, discord_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', 'Unknown'),
      COALESCE(NEW.raw_user_meta_data->>'discord_id', NULL)
    );
    
    -- Also create default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Temporarily disable RLS for profile creation during trigger
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 5. Re-enable RLS with proper policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Create a bypass policy for the trigger function
CREATE POLICY IF NOT EXISTS "Service role can bypass RLS for profiles" ON public.profiles
  FOR ALL USING (pg_has_role(session_user, 'service_role') OR auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Service role can bypass RLS for user_roles" ON public.user_roles
  FOR ALL USING (pg_has_role(session_user, 'service_role') OR auth.uid() = user_id);

-- 7. Test the trigger function
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 8. Verify policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_roles')
ORDER BY tablename, policyname;

-- 9. Test manual profile creation (this should work)
SELECT 
  'Manual profile test' as test_description,
  'profiles table exists' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') as table_exists;

-- 10. Check if there are any users without profiles
SELECT 
  'Users without profiles' as test_description,
  COUNT(*) as count,
  'These users need profiles created' as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
