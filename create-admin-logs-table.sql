-- Create admin_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow owners to see all logs
CREATE POLICY "Owners can view all admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'owner'
        )
    );

-- Allow admins to see their own logs
CREATE POLICY "Admins can view their own logs" ON admin_logs
    FOR SELECT USING (
        actor_user_id = auth.uid()
    );

-- Allow owners and admins to insert logs
CREATE POLICY "Owners and admins can insert logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('owner', 'admin')
        )
    );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_actor_user_id ON admin_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

-- Grant permissions
GRANT SELECT, INSERT ON admin_logs TO authenticated;
GRANT SELECT, INSERT ON admin_logs TO service_role;
