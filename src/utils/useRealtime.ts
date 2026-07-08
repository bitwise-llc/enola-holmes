import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { CoinTransaction } from '@/utils/coins';

type Profile = { coins: number; code: string; count: number };

// Monotonic id so two mounts of the same hook (e.g. tabs home + the pushed coins
// screen) get DISTINCT channel names. A shared name made the second subscriber's
// mount remove the first's live channel, killing updates on one screen. Unique
// names per instance means neither ever touches the other's channel.
let channelSeq = 0;

// Live view of the signed-in user's profile row (coins + referral). Fetches once,
// then subscribes to postgres_changes on that single row so any server-side coin/
// referral change (scan, purchase, referral landing) reflects on screen instantly —
// no focus-refresh or polling. Realtime must be enabled on `profiles` (see
// supabase/ENABLE-REALTIME.sql). Falls back to the initial fetch if the socket drops.
// Returns a `refresh` callback so the UI can pull-to-refresh if realtime lags/drops.
export const useProfile = (): { profile: Profile | null; refresh: () => Promise<void> } => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const seq = useRef(++channelSeq);

  const refresh = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('coins, referral_code, referral_count')
      .eq('id', session.user.id)
      .single();
    if (data) setProfile({ coins: data.coins ?? 0, code: data.referral_code ?? '', count: data.referral_count ?? 0 });
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      const uid = session.user.id;

      const apply = (row: { coins?: number; referral_code?: string; referral_count?: number }) =>
        setProfile({
          coins: row.coins ?? 0,
          code: row.referral_code ?? '',
          count: row.referral_count ?? 0,
        });

      const { data } = await supabase
        .from('profiles')
        .select('coins, referral_code, referral_count')
        .eq('id', uid)
        .single();
      if (cancelled) return;
      if (data) apply(data);

      // Guard against the async-cleanup race: if this run was torn down while
      // awaiting (Fast Refresh / StrictMode double-invoke), don't wire up a
      // channel. Name is unique per hook instance (see channelSeq) so concurrent
      // mounts on different screens never share — and thus never remove — a channel.
      if (cancelled) return;
      const name = `profile:${uid}:${seq.current}`;

      channel = supabase
        .channel(name)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
          (payload) => apply(payload.new as any),
        )
        .subscribe();
    })();

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
  }, []);

  return { profile, refresh };
};

// Live coin ledger, newest first. Fetches once, then prepends any INSERT to this
// user's transactions as they happen. RLS ("own txns") already scopes the stream.
export const useCoinTransactions = (): { txns: CoinTransaction[]; loading: boolean } => {
  const [txns, setTxns] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const seq = useRef(++channelSeq);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) { setLoading(false); return; }
      const uid = session.user.id;

      const { data } = await supabase
        .from('coin_transactions')
        .select('id, amount, reason, created_at')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      setTxns(data ?? []);
      setLoading(false);

      // See useProfile: guard the async-cleanup race. Unique per-instance name
      // (channelSeq) so concurrent mounts never share or remove each other's channel.
      if (cancelled) return;
      const name = `txns:${uid}:${seq.current}`;

      channel = supabase
        .channel(name)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'coin_transactions', filter: `user_id=eq.${uid}` },
          (payload) => setTxns((prev) => [payload.new as CoinTransaction, ...prev]),
        )
        .subscribe();
    })();

    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
  }, []);

  return { txns, loading };
};
