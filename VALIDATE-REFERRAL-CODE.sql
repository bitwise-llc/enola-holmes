-- VALIDATE REFERRAL CODE (pre-auth)
-- The onboarding "Got a Code?" screen must validate a referral code BEFORE the
-- anonymous account exists. RLS on profiles only allows auth.uid() = id, so the
-- client can't SELECT codes during onboarding. This SECURITY DEFINER RPC answers
-- one boolean question — "does this code belong to a real user?" — and nothing
-- else, so it leaks no profile data. Granted to anon so it works pre-auth.

CREATE OR REPLACE FUNCTION public.referral_code_exists(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE referral_code = p_code
  );
$$;

GRANT EXECUTE ON FUNCTION public.referral_code_exists(TEXT) TO anon, authenticated;

-- Self-check (dev only): run in a transaction, ROLLBACK.
-- BEGIN;
--   INSERT INTO profiles (id, coins, referral_code)
--     VALUES ('44444444-4444-4444-4444-444444444444', 1, 'REAL42');
--   SELECT referral_code_exists('REAL42');   -- expect true
--   SELECT referral_code_exists('NOPE99');   -- expect false
--   SELECT referral_code_exists('');         -- expect false
-- ROLLBACK;
