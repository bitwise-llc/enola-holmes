-- ENABLE REALTIME for coins + referral live updates.
-- The app subscribes (src/utils/useRealtime.ts) to changes on the signed-in user's
-- own rows so balance, referral count, and coin history update on screen the instant
-- they change server-side. Realtime only streams a table once it's in the
-- supabase_realtime publication. Safe to re-run.

-- profiles: we filter by id=eq.<uid> and read all columns from the UPDATE payload,
-- so FULL replica identity is required (default only sends the primary key).
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coin_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coin_transactions;
  END IF;
END $$;

-- RLS still governs what a client can receive: the "own txns" SELECT policy and the
-- profiles SELECT policy scope each user's stream to their own rows. No extra grants.
