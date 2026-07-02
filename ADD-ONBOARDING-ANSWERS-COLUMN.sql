-- Store each user's onboarding questionnaire selections (how they found us,
-- who they plan to search, what result is beneficial) as JSON on their profile.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_answers JSONB;
