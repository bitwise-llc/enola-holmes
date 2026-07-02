import { supabase } from './supabase';

/**
 * Get current logged-in user ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Check user's current coin balance
 */
export async function getCoinBalance(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;
  try {
    const { data, error } = await supabase.rpc('get_coin_balance', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error getting coin balance:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Exception getting coin balance:', error);
    return 0;
  }
}

/**
 * Save a search to history. Does NOT deduct a coin — the face-search Edge Function
 * already charged it server-side. Plain insert; the "insert own searches" RLS policy
 * scopes it to the current user. Best-effort: a failed insert must not block results.
 */
export async function recordSearch(
  imageUrl: string,
  resultsCount: number,
  resultsData: any[]
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const trimmedResults = resultsData.slice(0, 10).map(item => ({
    url: item.url,
    score: item.score,
    title: item.title || '',
  }));
  const { error } = await supabase.from('searches').insert({
    user_id: userId,
    image_url: imageUrl,
    results_count: resultsCount,
    results: trimmedResults,
  });
  if (error) console.error('recordSearch:', error);
}

/**
 * Get user's recent searches
 */
export async function getRecentSearches(limit: number = 20): Promise<any[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  try {
    // Use direct query without RLS for testing
    const { data, error } = await supabase
      .from('searches')
      .select('id, image_url, results_count, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching searches:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching searches:', error);
    return [];
  }
}

/**
 * Get detailed search result by ID
 */
export async function getSearchById(searchId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .single();

    if (error) {
      console.error('Error fetching search:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching search:', error);
    return null;
  }
}
