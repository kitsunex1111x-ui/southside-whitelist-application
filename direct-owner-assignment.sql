-- Direct owner role assignment for Discord ID 1266017433010045059
-- First, find your user ID by Discord ID
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE raw_user_meta_data->>'provider_id' = '1266017433010045059' 
   OR raw_user_meta_data->>'discord_id' = '1266017433010045059';

-- Copy the user ID from the result above and use it in this INSERT:
-- Replace the placeholder below with your actual user ID

INSERT INTO user_roles (user_id, role) 
VALUES ('PASTE_YOUR_USER_ID_HERE', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner', updated_at = NOW();

-- Verify the role was assigned
SELECT ur.role, u.email, u.raw_user_meta_data
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.raw_user_meta_data->>'provider_id' = '1266017433010045059' 
   OR u.raw_user_meta_data->>'discord_id' = '1266017433010045059';
