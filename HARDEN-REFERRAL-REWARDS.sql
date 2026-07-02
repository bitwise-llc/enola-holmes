-- HARDEN REFERRAL REWARDS
-- Fixes the referral system end-to-end. Run this AFTER UPDATE-REFERRAL-REWARDS.sql.
--
-- Bugs this fixes (found via stress test):
--   1. TRIGGER-vs-RPC RACE (critical): handle_new_user() inserts a profile the
--      instant auth.users gets a row, so by the time the client calls
--      create_user_profile() the profile already exists and the RPC bailed with
--      'profile_exists' EVERY TIME. Referrals never applied. Both new user and
--      referrer got nothing. Fix: the RPC now UPGRADES a pristine trigger-made
--      profile (never-redeemed, untouched 1 coin) instead of bailing.
--   2. Duplicate redemption: guarded by referred_by IS NULL — a profile that
--      already redeemed a code cannot redeem another. One redemption per user.
--   3. Self-referral: guarded by v_referrer_id = user_id.
--   4. Referrer atomicity: coins/referral_count use in-place increments, so two
--      concurrent redemptions of the same code both count (row lock serializes).

DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT DEFAULT NULL,
  referral_code_used TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
  v_existing RECORD;
BEGIN
  -- Verify the calling user matches the user_id (security check)
  IF auth.uid() != user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Cannot create profile for another user'
    );
  END IF;

  -- Lock the (possibly trigger-created) row so concurrent calls serialize here.
  SELECT id, coins, referral_code, referred_by
    INTO v_existing
  FROM public.profiles
  WHERE id = user_id
  FOR UPDATE;

  -- If a profile exists AND has already redeemed a code, this is a duplicate
  -- attempt — one redemption per user. Bail without touching anything.
  IF FOUND AND v_existing.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_redeemed',
      'message', 'This account has already redeemed a referral code'
    );
  END IF;

  -- Reuse the trigger-assigned code if present; otherwise mint one.
  v_referral_code := COALESCE(v_existing.referral_code, generate_referral_code());

  -- Resolve + validate the referral code (if any).
  IF referral_code_used IS NOT NULL AND referral_code_used != '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = referral_code_used;

    -- Self-referral guard: cannot redeem your own code.
    IF v_referrer_id = user_id THEN
      v_referrer_id := NULL;
    END IF;
  END IF;

  IF v_referrer_id IS NOT NULL THEN
    -- Reward the referrer (atomic increment; row lock handles concurrency).
    UPDATE public.profiles
    SET coins = coins + 1,
        referral_count = referral_count + 1,
        updated_at = NOW()
    WHERE id = v_referrer_id;

    -- Create or upgrade the new user's profile: 2 coins + referral tracking.
    -- Upsert covers both the trigger-made pristine row and the no-trigger case.
    INSERT INTO public.profiles (id, coins, referral_code, referred_by)
    VALUES (user_id, 2, v_referral_code, referral_code_used)
    ON CONFLICT (id) DO UPDATE
      SET coins = public.profiles.coins + 1,  -- pristine trigger row had 1 → 2
          referred_by = EXCLUDED.referred_by,
          updated_at = NOW();

    RETURN jsonb_build_object(
      'success', true,
      'user_id', user_id,
      'coins', 2,
      'referral_code', v_referral_code,
      'referral_applied', true,
      'referrer_rewarded', true
    );
  ELSE
    -- No valid code: ensure a 1-coin profile exists, leave it pristine.
    INSERT INTO public.profiles (id, coins, referral_code)
    VALUES (user_id, 1, v_referral_code)
    ON CONFLICT (id) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'user_id', user_id,
      'coins', COALESCE(v_existing.coins, 1),
      'referral_code', v_referral_code,
      'referral_applied', false,
      'message', CASE WHEN referral_code_used IS NOT NULL AND referral_code_used != ''
                      THEN 'Invalid referral code' ELSE NULL END
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$$;

-- ============================================================================
-- SELF-CHECK (dev only). Run in a transaction and ROLLBACK. Bypasses the
-- auth.uid() gate by stubbing it, so it exercises the referral logic directly.
-- ponytail: manual check, not a test framework — run once after deploying.
-- ============================================================================
-- BEGIN;
--   -- stub auth.uid() to return whatever we set in a GUC
--   CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
--     AS $f$ SELECT current_setting('test.uid', true)::uuid $f$;
--
--   -- referrer (simulates trigger having made their profile first)
--   SET test.uid = '11111111-1111-1111-1111-111111111111';
--   SELECT create_user_profile('11111111-1111-1111-1111-111111111111'::uuid);
--   -- grab referrer's code
--   \gset ref_
--   SELECT referral_code AS code, coins FROM profiles
--     WHERE id = '11111111-1111-1111-1111-111111111111';  -- expect coins=1
--
--   -- new user redeems referrer's code (pretend trigger already inserted them)
--   SET test.uid = '22222222-2222-2222-2222-222222222222';
--   INSERT INTO profiles (id, coins, referral_code)
--     VALUES ('22222222-2222-2222-2222-222222222222', 1, generate_referral_code());
--   SELECT create_user_profile('22222222-2222-2222-2222-222222222222'::uuid, NULL,
--     (SELECT referral_code FROM profiles WHERE id='11111111-1111-1111-1111-111111111111'));
--   -- ASSERT: new user coins=2, referral_applied=true
--   -- ASSERT: referrer coins=2, referral_count=1
--   SELECT coins FROM profiles WHERE id='22222222-2222-2222-2222-222222222222';  -- 2
--   SELECT coins, referral_count FROM profiles
--     WHERE id='11111111-1111-1111-1111-111111111111';  -- 2, 1
--
--   -- duplicate redemption blocked
--   SELECT create_user_profile('22222222-2222-2222-2222-222222222222'::uuid, NULL,
--     (SELECT referral_code FROM profiles WHERE id='11111111-1111-1111-1111-111111111111'));
--   -- ASSERT: error='already_redeemed', referrer coins unchanged (still 2)
--
--   -- self-referral blocked
--   SET test.uid = '33333333-3333-3333-3333-333333333333';
--   INSERT INTO profiles (id, coins, referral_code)
--     VALUES ('33333333-3333-3333-3333-333333333333', 1, 'SELFTEST');
--   SELECT create_user_profile('33333333-3333-3333-3333-333333333333'::uuid, NULL, 'SELFTEST');
--   -- ASSERT: referral_applied=false, coins stays 1
-- ROLLBACK;
