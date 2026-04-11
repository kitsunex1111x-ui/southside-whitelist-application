-- COMPLETE OWNER SETUP - Creates table and adds both users as owners

-- Step 1: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'owner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add Discord user as owner
-- Discord ID: 1266017433010045059 needs to be converted to UUID
-- Using a UUID generator for the Discord user ID
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('00000000-0000-0000-000000000000', 'owner', NOW())
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- Step 3: Add Google user as owner (need to find their user ID first)
-- First, let's see if we can find the Google user
SELECT 
    id, 
    email, 
    created_at,
    'Your Google user ID will appear here after they log in once'
FROM auth.users 
WHERE email = 'kitsunex1111x@gmail.com';

-- After Google user logs in once, run this to add them as owner:
-- INSERT INTO user_roles (user_id, role, created_at)
-- VALUES ('ACTUAL_GOOGLE_USER_ID', 'owner', NOW())
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- Step 4: Verify both users are added as owners
SELECT 
    ur.user_id,
    ur.role,
    ur.created_at,
    u.email
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE ur.role = 'owner'
ORDER BY ur.created_at DESC;
