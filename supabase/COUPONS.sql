-- Client coupon codes that grant a batch of coins. Reuses the coin system:
-- redeeming just calls add_coins with reason 'coupon_redemption'; the coins then
-- burn down per scan like any balance. Two tables (definition + redemptions) and
-- one RPC. Dedup is enforced two ways: the redemptions PK (one use per user) and
-- add_coins' own external_id dedup.

-- ADD VALUE can't run inside a txn block with older PG and must be committed before
-- use, so run this enum line on its own first.
ALTER TYPE public.coin_reason ADD VALUE IF NOT EXISTS 'coupon_redemption';

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coupons (
  code        TEXT PRIMARY KEY,            -- e.g. 'ACME-2026'
  coins       INTEGER NOT NULL CHECK (coins > 0),
  max_uses    INTEGER CHECK (max_uses IS NULL OR max_uses > 0),  -- null = unlimited redemptions
  uses        INTEGER NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,                 -- null = never expires
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  code        TEXT NOT NULL REFERENCES public.coupons(code),
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (code, user_id)              -- one redemption per user per code
);

-- Only the RPC (SECURITY DEFINER) writes these; users never touch them directly.
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
-- No policies => no direct client access. Redemption goes through redeem_coupon.

-- ---------------------------------------------------------------------------
-- Redeem a coupon for the calling user. Returns the new coin balance.
-- Raises on: unknown code, expired, exhausted, or already redeemed by this user.
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user   UUID := auth.uid();
  v_coupon RECORD;
  v_new    INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- Lock the coupon row so concurrent redemptions can't blow past max_uses.
  SELECT * INTO v_coupon FROM public.coupons WHERE code = p_code FOR UPDATE;
  IF v_coupon.code IS NULL THEN RAISE EXCEPTION 'invalid coupon'; END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RAISE EXCEPTION 'coupon expired';
  END IF;
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'coupon fully redeemed';
  END IF;

  -- One use per user — PK violation here means they already redeemed it.
  INSERT INTO public.coupon_redemptions (code, user_id) VALUES (p_code, v_user);

  UPDATE public.coupons SET uses = uses + 1 WHERE code = p_code;

  -- Grant the coins. external_id = code:user keeps add_coins' own dedup honest.
  v_new := public.add_coins(
    v_user, v_coupon.coins, 'coupon_redemption'::public.coin_reason, p_code || ':' || v_user::text
  );
  RETURN v_new;

EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'coupon already redeemed';
END; $$;

GRANT EXECUTE ON FUNCTION public.redeem_coupon(TEXT) TO authenticated;

-- Create a coupon (run manually / from an admin context, service role only):
-- INSERT INTO public.coupons (code, coins, max_uses, expires_at)
--   VALUES ('ACME-2026', 500, 1, '2026-12-31');
