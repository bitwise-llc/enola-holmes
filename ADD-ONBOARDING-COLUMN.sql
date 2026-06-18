-- Add onboarding_completed column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Update existing profiles to mark them as onboarding completed
UPDATE profiles
SET onboarding_completed = true
WHERE onboarding_completed IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
ON profiles(onboarding_completed);
