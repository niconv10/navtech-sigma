-- Add new columns to profiles for survey data and notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signup_source TEXT,
ADD COLUMN IF NOT EXISTS primary_challenge TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_reminders": true, "weekly_summary": true}';

-- Add emoji column to semesters for semester display
ALTER TABLE public.semesters 
ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '📚';