-- Create VIEW for admin_logs with Discord info to avoid PostgREST join issues
CREATE OR REPLACE VIEW public.admin_logs_with_discord AS
SELECT
  al.id,
  al.created_at,
  al.actor_user_id,
  al.action,
  al.details,
  COALESCE(idn.provider, 'unknown') as provider,
  COALESCE(idn.identity_data->>'name', 'Unknown Admin') as admin_name,
  COALESCE(idn.identity_data->>'avatar_url', '') as admin_avatar
FROM public.admin_logs al
LEFT JOIN auth.identities idn
  ON idn.user_id = al.actor_user_id AND idn.provider = 'discord';

-- Grant permissions on the view
GRANT SELECT ON public.admin_logs_with_discord TO authenticated;
GRANT SELECT ON public.admin_logs_with_discord TO service_role;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_with_discord_created_at 
ON public.admin_logs_with_discord(created_at DESC);
