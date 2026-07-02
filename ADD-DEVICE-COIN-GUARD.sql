-- DEVICE-LEVEL FREE-COIN GUARD
-- Problem: deleting the app wipes the Supabase session (AsyncStorage), so a
-- reinstall mints a brand-new anonymous account that gets a fresh free coin.
-- A FaceCheck.id search costs real money, so 1 free coin per reinstall = paid
-- searches farmed for free, repeatable forever.
--
-- Fix: anchor the free grant to the RevenueCat anonymous app-user-id, which
-- lives in the iOS keychain and SURVIVES reinstall (on the same store account).
-- The client passes that id; the first profile from a device gets its coin, any
-- later profile from the same device is created with 0 coins.
--
-- Run AFTER HARDEN-REFERRAL-REWARDS.sql. Referral logic is unchanged; a valid
-- referral code still grants its bonus (a real referral isn't reinstall abuse).

-- 1. Ledger of devices that have already claimed their free coin. One row per
--    device; the first profile to claim wins. profile_id is informational.
CREATE TABLE IF NOT EXISTS public.device_claims (
  device_id  TEXT PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);
-- Only the RPC (SECURITY DEFINER) touches this table; no client policies.
ALTER TABLE public.device_claims ENABLE ROW LEVEL SECURITY;

-- 2. Replace the RPC with a device_id-aware version. New param is nullable and
--    LAST, so existing 3-arg calls keep working (null device_id = no guard,
--    behaves exactly as before). Body is HARDEN-REFERRAL-REWARDS plus the guard.
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT DEFAULT NULL,
  referral_code_used TEXT DEFAULT NULL,
  device_id TEXT DEFAULT NULL
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
  -- Verify the calling user matches the user_id (security check)
  IF auth.uid() != user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Cannot create profile for another user'
    );
  END IF;

  -- Device guard: has this device already claimed a free coin? Claim it now if
  -- not (INSERT ... DO NOTHING is atomic; the row that inserts is the winner).
  IF device_id IS NOT NULL AND device_id != '' THEN
    INSERT INTO public.device_claims (device_id, profile_id)
    VALUES (device_id, user_id)
    ON CONFLICT (device_id) DO NOTHING;
    -- No row inserted => the device was already in the ledger => reclaim => 0 coins.
    IF NOT FOUND THEN
      v_device_claimed := true;
      v_free_coins := 0;
    END IF;
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

  -- The trigger may have already granted 1 coin on a reclaimed device. Claw it
  -- back to the intended free grant (0) before any referral bonus is applied.
  IF FOUND AND v_device_claimed THEN
    UPDATE public.profiles
    SET coins = v_free_coins, updated_at = NOW()
    WHERE id = user_id;
    v_existing.coins := v_free_coins;
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

    -- Create or upgrade the new user's profile: free grant + 1 referral coin.
    -- (Reclaimed device => free grant is 0, so a referral still gives exactly 1.)
    INSERT INTO public.profiles (id, coins, referral_code, referred_by)
    VALUES (user_id, v_free_coins + 1, v_referral_code, referral_code_used)
    ON CONFLICT (id) DO UPDATE
      SET coins = public.profiles.coins + 1,  -- pristine/clawed row + referral coin
          referred_by = EXCLUDED.referred_by,
          updated_at = NOW();

    RETURN jsonb_build_object(
      'success', true,
      'user_id', user_id,
      'coins', v_free_coins + 1,
      'referral_code', v_referral_code,
      'referral_applied', true,
      'referrer_rewarded', true,
      'device_reclaimed', v_device_claimed
    );
  ELSE
    -- No valid code: ensure a profile exists with the free grant (1, or 0 if
    -- the device already claimed).
    INSERT INTO public.profiles (id, coins, referral_code)
    VALUES (user_id, v_free_coins, v_referral_code)
    ON CONFLICT (id) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'user_id', user_id,
      'coins', COALESCE(v_existing.coins, v_free_coins),
      'referral_code', v_referral_code,
      'referral_applied', false,
      'device_reclaimed', v_device_claimed,
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
