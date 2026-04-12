-- Add owner role to specific user
-- This script will find the user by Discord ID or email and assign owner role

-- First, let's find your user ID by checking the auth.users table
-- You can run this query to find your user ID:

-- Find by Discord ID (if stored in user_metadata)
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE raw_user_meta_data->>'provider_id' = '1266017433010045059' 
   OR raw_user_meta_data->>'discord_id' = '1266017433010045059';

-- Find by email
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'kitsuenx1111x@gmail.com';

-- Once you have your user ID, run one of these commands:
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the queries above

-- Option 1: Insert owner role
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner', updated_at = NOW();

-- Option 2: If you want to see current roles first
SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID_HERE';

-- Option 3: Update existing role to owner
UPDATE user_roles 
SET role = 'owner', updated_at = NOW() 
WHERE user_id = 'YOUR_USER_ID_HERE';

-- After running this, you should be able to see the Owner dashboard
-- Check your final role assignment:
SELECT ur.role, u.email, u.raw_user_meta_data
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'kitsuenx1111x@gmail.com' 
   OR u.raw_user_meta_data->>'provider_id' = '1266017433010045059';
