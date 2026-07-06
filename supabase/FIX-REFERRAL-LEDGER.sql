-- FIX REFERRAL LEDGER  (run LAST — supersedes every prior create_user_profile)
--
-- Two bugs, one root cause: the referral grants in create_user_profile write
-- coins straight to profiles and NEVER touch coin_transactions.
--   1. Referrer got no coin: several older copies of this RPC exist in this repo
--      (REFERRAL-SYSTEM-SETUP, UPDATE-REFERRAL-REWARDS, HARDEN-..., ADD-DEVICE-...).
--      Each CREATE OR REPLACEs the same function, so whichever was run last in the
--      SQL editor is what's live — and if a non-crediting one won, the referrer got
--      nothing. This file is the authoritative version; run it LAST and it wins.
--   2. No transaction history: referral coins bypassed the coin_transactions ledger
--      that spend_coin / add_coins already use, so they never showed in history.
--
-- Fix: keep the full device-guard + hardening logic from ADD-DEVICE-COIN-GUARD,
-- and log EVERY coin movement (free grant, referral bonus to new user, referrer
-- bonus) into coin_transactions. Requires coins-and-iap.sql (the ledger table)
-- to have been run first.

-- Log a user's one-time signup grant, at most once, ever. The trigger grants the
-- coin without a ledger row and always races ahead of this RPC, so we can't key the
-- log off "did the RPC insert the row" — we key it off "has a signup_bonus already
-- been recorded". NOT EXISTS + the caller's FOR UPDATE on the profile row make this
-- safe against concurrent/duplicate create_user_profile calls for the same user.
CREATE OR REPLACE FUNCTION public._log_signup_bonus(p_user_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_amount <= 0 THEN RETURN; END IF;  -- reclaimed device => 0 coins => nothing to log
  INSERT INTO public.coin_transactions (user_id, amount, reason, source)
  SELECT p_user_id, p_amount, 'signup_bonus', 'app'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.coin_transactions
    WHERE user_id = p_user_id AND reason = 'signup_bonus'
  );
END; $$;

-- Internal only: called via PERFORM from create_user_profile. Clients must not be
-- able to forge ledger rows, so revoke the default PUBLIC execute grant.
REVOKE EXECUTE ON FUNCTION public._log_signup_bonus(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._log_signup_bonus(UUID, INTEGER) FROM authenticated;

DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT);

-- NOTE: the device param is p_device_id, NOT device_id. device_claims has a column
-- named device_id, and an unqualified `device_id` in `ON CONFLICT (device_id)` is
-- ambiguous between param and column — Postgres raises "column reference is ambiguous"
-- and the whole RPC fails with database_error whenever a device id is passed. The
-- prior ADD-DEVICE-COIN-GUARD.sql has this latent bug; this file supersedes it.
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT DEFAULT NULL,
  referral_code_used TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL
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
  v_device_claimed BOOLEAN := false;  -- true => this device already got its free coin
  v_free_coins INTEGER := 1;          -- free grant for a no-code signup (0 if reclaimed)
BEGIN
  IF auth.uid() != user_id THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'unauthorized',
      'message', 'Cannot create profile for another user'
    );
  END IF;

  -- Device guard: has this device already claimed a free coin? Claim it now if not.
  IF p_device_id IS NOT NULL AND p_device_id != '' THEN
    INSERT INTO public.device_claims (device_id, profile_id)
    VALUES (p_device_id, user_id)
    ON CONFLICT (device_id) DO NOTHING;
    IF NOT FOUND THEN
      v_device_claimed := true;
      v_free_coins := 0;
    END IF;
  END IF;

  -- Lock the (possibly trigger-created) row so concurrent calls for THIS user
  -- serialize here: the first sets referred_by + credits the referrer, the second
  -- sees referred_by and bails at 'already_redeemed'. The referrer is credited once.
  -- ponytail: relies on the row existing to have something to lock. The auth.users
  -- trigger always creates it before the client can call this RPC, so it always does.
  -- If that trigger were ever removed, add an advisory lock on user_id here.
  SELECT id, coins, referral_code, referred_by
    INTO v_existing
  FROM public.profiles
  WHERE id = user_id
  FOR UPDATE;

  -- Already redeemed => duplicate attempt, one redemption per user. Bail.
  IF FOUND AND v_existing.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'already_redeemed',
      'message', 'This account has already redeemed a referral code'
    );
  END IF;

  -- The trigger may have granted 1 coin on a reclaimed device. Claw it back to 0.
  IF FOUND AND v_device_claimed THEN
    UPDATE public.profiles
    SET coins = v_free_coins, updated_at = NOW()
    WHERE id = user_id;
    v_existing.coins := v_free_coins;
  END IF;

  v_referral_code := COALESCE(v_existing.referral_code, generate_referral_code());

  -- Resolve + validate the referral code.
  IF referral_code_used IS NOT NULL AND referral_code_used != '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = referral_code_used;

    IF v_referrer_id = user_id THEN  -- self-referral guard
      v_referrer_id := NULL;
    END IF;
  END IF;

  IF v_referrer_id IS NOT NULL THEN
    -- Reward the referrer: +1 coin, and LOG IT so it appears in their history.
    UPDATE public.profiles
    SET coins = coins + 1,
        referral_count = referral_count + 1,
        updated_at = NOW()
    WHERE id = v_referrer_id;

    INSERT INTO public.coin_transactions (user_id, amount, reason, source)
      VALUES (v_referrer_id, 1, 'referral_bonus', 'app');

    -- Create/upgrade the new user: free grant + 1 referral coin.
    INSERT INTO public.profiles (id, coins, referral_code, referred_by)
    VALUES (user_id, v_free_coins + 1, v_referral_code, referral_code_used)
    ON CONFLICT (id) DO UPDATE
      SET coins = public.profiles.coins + 1,
          referred_by = EXCLUDED.referred_by,
          updated_at = NOW();

    -- Log the signup grant (idempotent — see helper below) and the referral coin.
    -- referred_by IS NULL guards this whole branch, so referral_redeemed logs once.
    PERFORM public._log_signup_bonus(user_id, v_free_coins);
    INSERT INTO public.coin_transactions (user_id, amount, reason, source)
      VALUES (user_id, 1, 'referral_redeemed', 'app');

    RETURN jsonb_build_object(
      'success', true, 'user_id', user_id, 'coins', v_free_coins + 1,
      'referral_code', v_referral_code, 'referral_applied', true,
      'referrer_rewarded', true, 'device_reclaimed', v_device_claimed
    );
  ELSE
    -- No valid code: ensure a profile exists with the free grant.
    INSERT INTO public.profiles (id, coins, referral_code)
    VALUES (user_id, v_free_coins, v_referral_code)
    ON CONFLICT (id) DO NOTHING;

    -- Log the signup grant. Idempotent, so it's correct whether the trigger or this
    -- INSERT created the row, and safe if the client retries create_user_profile.
    PERFORM public._log_signup_bonus(user_id, v_free_coins);

    RETURN jsonb_build_object(
      'success', true, 'user_id', user_id,
      'coins', COALESCE(v_existing.coins, v_free_coins),
      'referral_code', v_referral_code, 'referral_applied', false,
      'device_reclaimed', v_device_claimed,
      'message', CASE WHEN referral_code_used IS NOT NULL AND referral_code_used != ''
                      THEN 'Invalid referral code' ELSE NULL END
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'database_error', 'message', SQLERRM
    );
END;
$$;

-- ==========================================================================
-- SELF-CHECK (dev only). Run in a transaction and ROLLBACK. Stubs auth.uid() and
-- SIMULATES THE TRIGGER by inserting the 1-coin profile row first (that's the exact
-- race this file fixes: the trigger grants the coin, this RPC must still log it and
-- credit the referrer). ponytail: manual check, run once after deploying.
-- Covers: referrer credit (balance + ledger), signup_bonus logged despite the
-- trigger, idempotent re-call, and blocked duplicate redemption.
-- ==========================================================================
-- BEGIN;
--   CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
--     AS $f$ SELECT current_setting('test.uid', true)::uuid $f$;
--   DO $t$
--   DECLARE
--     ref  uuid := '11111111-1111-1111-1111-111111111111';
--     new1 uuid := '22222222-2222-2222-2222-222222222222';
--     v_code text; v_coins int; v_cnt int; v_signup int; v_redeem int; v_bonus int;
--   BEGIN
--     -- Simulate the trigger for the referrer, then run the RPC (no code).
--     PERFORM set_config('test.uid', ref::text, true);
--     INSERT INTO profiles (id, coins, referral_code) VALUES (ref, 1, generate_referral_code());
--     PERFORM create_user_profile(ref);
--     SELECT referral_code, coins INTO v_code, v_coins FROM profiles WHERE id = ref;
--     SELECT count(*) INTO v_signup FROM coin_transactions WHERE user_id=ref AND reason='signup_bonus';
--     ASSERT v_coins = 1, 'referrer should have 1 coin';
--     ASSERT v_signup = 1, 'referrer signup_bonus must be logged exactly once despite trigger';
--
--     -- Re-call the RPC for the referrer (client retry) — must NOT double-log signup.
--     PERFORM create_user_profile(ref);
--     SELECT count(*) INTO v_signup FROM coin_transactions WHERE user_id=ref AND reason='signup_bonus';
--     ASSERT v_signup = 1, 'signup_bonus must stay at 1 on re-call (idempotent)';
--
--     -- New user (trigger row exists) redeems the referrer's code.
--     PERFORM set_config('test.uid', new1::text, true);
--     INSERT INTO profiles (id, coins, referral_code) VALUES (new1, 1, generate_referral_code());
--     PERFORM create_user_profile(new1, NULL, v_code);
--     SELECT coins INTO v_coins FROM profiles WHERE id = new1;
--     SELECT count(*) INTO v_signup FROM coin_transactions WHERE user_id=new1 AND reason='signup_bonus';
--     SELECT count(*) INTO v_redeem FROM coin_transactions WHERE user_id=new1 AND reason='referral_redeemed';
--     ASSERT v_coins = 2, 'new user should have 2 coins (1 free + 1 referral)';
--     ASSERT v_signup = 1 AND v_redeem = 1, 'new user ledger: 1 signup_bonus + 1 referral_redeemed';
--
--     -- Referrer got credited: balance, count, and ledger.
--     SELECT coins, referral_count INTO v_coins, v_cnt FROM profiles WHERE id = ref;
--     SELECT count(*) INTO v_bonus FROM coin_transactions WHERE user_id=ref AND reason='referral_bonus';
--     ASSERT v_coins = 2, 'referrer should have 2 coins after one referral';
--     ASSERT v_cnt = 1 AND v_bonus = 1, 'referrer: referral_count=1 and one referral_bonus ledger row';
--
--     -- Duplicate redemption blocked, referrer unchanged.
--     PERFORM set_config('test.uid', new1::text, true);
--     PERFORM create_user_profile(new1, NULL, v_code);
--     SELECT coins INTO v_coins FROM profiles WHERE id = ref;
--     ASSERT v_coins = 2, 'referrer coins unchanged after blocked duplicate redemption';
--
--     RAISE NOTICE 'ALL REFERRAL LEDGER SELF-CHECKS PASSED';
--   END $t$;
-- ROLLBACK;
