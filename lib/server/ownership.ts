import type { SupabaseClient } from '@supabase/supabase-js';

export type OwnedGameEntry = {
  gameId: string;
  acquiredAt: string;
  source: 'library';
};

// ✅ SINGLE SOURCE OF TRUTH → library
export async function checkUserOwnsGame(
  supabase: SupabaseClient,
  userId: string,
  gameId: string
) {
  if (!userId || !gameId) return false;

  const { data, error } = await supabase
    .from('library')
    .select('id')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

// ✅ GET USER LIBRARY
export async function getUserOwnedGameEntries(
  supabase: SupabaseClient,
  userId: string
): Promise<OwnedGameEntry[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('library')
    .select('game_id, acquired_at')
    .eq('user_id', userId)
    .order('acquired_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    gameId: item.game_id,
    acquiredAt: item.acquired_at,
    source: 'library',
  }));
}