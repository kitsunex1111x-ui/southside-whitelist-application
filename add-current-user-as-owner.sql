-- First, let's see your current user info
SELECT 
  id, 
  email, 
  created_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Then add your user as owner (replace YOUR_USER_ID with the actual ID from above)
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('YOUR_USER_ID', 'owner', NOW())
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- Verify the owner role was added
SELECT ur.*, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE ur.role = 'owner';
