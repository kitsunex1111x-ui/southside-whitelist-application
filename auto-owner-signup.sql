-- AUTOMATIC OWNER ACCESS ON SIGNUP
-- This SQL creates triggers and policies to automatically assign owner role to new users

-- Step 1: Create function to automatically assign owner role
CREATE OR REPLACE FUNCTION public.auto_assign_owner_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically assign owner role to new users
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (
        NEW.id,
        'owner',
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger to auto-assign owner role on user creation
DROP TRIGGER IF EXISTS public.on_auth_user_created;
CREATE TRIGGER public.on_auth_user_created
    AFTER INSERT ON public.auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_owner_role();

-- Step 3: Create policy to allow users to read their own roles
DROP POLICY IF EXISTS public.users_can_read_own_roles ON public.user_roles;
CREATE POLICY public.users_can_read_own_roles ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Step 4: Create policy to allow users to insert their own roles
DROP POLICY IF EXISTS public.users_can_insert_own_roles ON public.user_roles;
CREATE POLICY public.users_can_insert_own_roles ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 5: Create policy to allow users to update their own roles
DROP POLICY IF EXISTS public.users_can_update_own_roles ON public.user_roles;
CREATE POLICY public.users_can_update_own_roles ON public.user_roles
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 6: Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_assign_owner_role() TO authenticated;

-- Step 8: Test the setup
SELECT 
    'Automatic owner access setup completed' as status,
    NOW() as setup_time;

-- Step 9: Verify trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_catalog,
    event_object_schema,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
