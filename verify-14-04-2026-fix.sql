-- Safety Check Query: Verify the specific 14/04/2026 entry is now fixed
-- This will confirm the backfill worked for that specific entry

SELECT 
  al.id,
  al.actor_user_id,
  al.created_at,
  al.action,
  al.details,
  al.display_name,
  al.username,
  p.username as profile_username,
  p.display_name as profile_display_name
FROM admin_logs al
LEFT JOIN profiles p ON al.actor_user_id = p.user_id
WHERE al.created_at >= '2026-04-14' 
  AND al.created_at < '2026-04-15'
  AND al.action = ANY('UPDATE applications', 'accept_application', 'reject_application')
ORDER BY al.created_at DESC
LIMIT 10;

-- Expected result: The 14/04/2026 entry should now show:
-- - display_name and username from profiles table (not NULL)
-- - profile_username and profile_display_name should match the backfilled values
