import { supabase } from '@/utils/supabase';

// Read current balance. Returns 0 if no session/profile.
export const getCoins = async (): Promise<number> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;
  const { data, error } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', session.user.id)
    .single();
  if (error) { console.error('getCoins:', error); return 0; }
  return data?.coins ?? 0;
};

// Read referral code + count in one query. Returns nulls if no session/profile.
export const getReferralInfo = async (): Promise<{ code: string; count: number }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { code: '', count: 0 };
  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code, referral_count')
    .eq('id', session.user.id)
    .single();
  if (error) { console.error('getReferralInfo:', error); return { code: '', count: 0 }; }
  return { code: data?.referral_code ?? '', count: data?.referral_count ?? 0 };
};

export type CoinTransaction = {
  id: string;
  amount: number;   // +credit / -spend
  reason: string;   // 'scan' | 'purchase' | 'referral_bonus' | 'signup_bonus' | ...
  created_at: string;
};

// Full coin ledger for the signed-in user, newest first. RLS ("own txns") scopes
// it to the caller, so a plain select is safe. Returns [] if no session/error.
export const getCoinTransactions = async (): Promise<CoinTransaction[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('coin_transactions')
    .select('id, amount, reason, created_at')
    .order('created_at', { ascending: false });
  if (error) { console.error('getCoinTransactions:', error); return []; }
  return data ?? [];
};

// Atomic spend via RPC. Returns the new balance, or null if insufficient/failed.
// No read-then-write in JS — Postgres does the check+deduct in one row update.
export const spendCoin = async (amount = 1): Promise<number | null> => {
  const { data, error } = await supabase.rpc('spend_coin', { p_amount: amount, p_reason: 'scan' });
  if (error) { console.error('spendCoin:', error); return null; }
  return data === -1 ? null : (data as number); // -1 = insufficient funds
};
