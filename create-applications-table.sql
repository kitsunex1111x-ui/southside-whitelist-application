-- Create applications table for the new Supabase project
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    real_name TEXT NOT NULL,
    discord TEXT NOT NULL,
    age TEXT NOT NULL,
    rdm TEXT NOT NULL,
    vdm TEXT NOT NULL,
    metagaming TEXT NOT NULL,
    powergaming TEXT NOT NULL,
    char_name TEXT NOT NULL,
    backstory TEXT NOT NULL,
    traits TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own applications" ON applications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON applications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and owners can view all applications" ON applications
FOR SELECT USING (
  auth.uid() = user_id OR
  raw_user_meta_data->>'role' IN ('admin', 'owner')
);

CREATE POLICY "Admins and owners can update all applications" ON applications
FOR UPDATE USING (
  auth.uid() = user_id OR
  raw_user_meta_data->>'role' IN ('admin', 'owner')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
