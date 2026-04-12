-- Minimal safe owner role assignment
-- Step 1: Find your auth user UUID
SELECT id, email, raw_user_meta_data, app_metadata
FROM auth.users
WHERE raw_user_meta_data->>'discord_id' = '1266017433010045059'
   OR raw_user_meta_data->>'provider_id' = '1266017433010045059'
   OR app_metadata->>'discord_id' = '1266017433010045059'
   OR app_metadata->>'provider_id' = '1266017433010045059'
   OR raw_user_meta_data->>'sub' = '1266017433010045059';

-- Step 2: Insert owner role using the UUID from above
-- Replace <UUID_HERE> with the actual id returned from Step 1
INSERT INTO public.user_roles (user_id, role)
VALUES ('<UUID_HERE>', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner', updated_at = NOW();

-- Step 3: Verify the assignment
SELECT ur.role, ur.user_id, u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'kitsuenx1111x@gmail.com';
