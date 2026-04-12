-- Assign owner role to Discord ID 1266017433010045059
-- This will find the user by Discord provider ID and assign owner role

-- Find user by Discord provider ID
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE raw_user_meta_data->>'provider_id' = '1266017433010045059' 
   OR raw_user_meta_data->>'discord_id' = '1266017433010045059';

-- Once you have the user ID from the query above, use it here:
-- Replace 'USER_ID_FROM_QUERY' with the actual ID returned

-- Assign owner role
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_FROM_QUERY', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner', updated_at = NOW();

-- Verify the role was assigned
SELECT ur.role, u.email, u.raw_user_meta_data
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.raw_user_meta_data->>'provider_id' = '1266017433010045059' 
   OR u.raw_user_meta_data->>'discord_id' = '1266017433010045059';
