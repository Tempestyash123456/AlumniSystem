-- Add bug_report_photo_url column to alumni_profiles table
ALTER TABLE alumni_profiles 
ADD COLUMN IF NOT EXISTS bug_report_photo_url TEXT;

-- Update existing records to null (optional, column will be null by default)
COMMENT ON COLUMN alumni_profiles.bug_report_photo_url IS 'Dedicated photo for the Bug Report page dev cards';
