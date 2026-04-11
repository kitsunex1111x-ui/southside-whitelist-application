-- Add Discord user as owner
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('1266017433010045059', 'owner', NOW())
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- Note: For Google user, you'll need to get their actual user_id after they first log in
-- The Google email kitsunex1111x@gmail.com will have a different user_id in the system

-- To find the Google user ID after they log in, run:
-- SELECT id, email FROM auth.users WHERE email = 'kitsunex1111x@gmail.com';

-- Then add them as owner with their actual user_id:
-- INSERT INTO user_roles (user_id, role, created_at)
-- VALUES ('ACTUAL_GOOGLE_USER_ID', 'owner', NOW())
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- Verify the owner role was added
SELECT * FROM user_roles WHERE role = 'owner';
