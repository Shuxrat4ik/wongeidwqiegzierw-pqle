import type { SupabaseClient } from '@supabase/supabase-js';
import { isDatabaseGameId } from '@/lib/game-id';

export type AddWishlistItemResult =
  | { ok: true; status: 'added' | 'exists'; item?: { id: string; user_id: string; game_id: string } | null }
  | { ok: false; status: 'invalid_game_id' | 'game_not_found' | 'invalid_user' | 'unauthorized' | 'forbidden' | 'conflict' | 'database_error'; error: string; detail?: string };

function supabaseErrorStatus(error: { code?: string; message?: string }) {
  if (error.code === '23505') return 'conflict' as const;
  if (error.code === '23503' && error.message?.includes('user_id')) return 'invalid_user' as const;
  if (error.code === '23503' || error.code === '22P02') return 'invalid_game_id' as const;
  if (error.code === '42501') return 'forbidden' as const;
  return 'database_error' as const;
}

export async function addWishlistItem(
  supabase: SupabaseClient,
  userId: string,
  gameId: string
): Promise<AddWishlistItemResult> {
  console.log('[wishlist:add] user.id:', userId);
  console.log('[wishlist:add] gameId:', gameId);

  if (!userId) {
    return { ok: false, status: 'unauthorized', error: 'Authentication required' };
  }

  if (!isDatabaseGameId(gameId)) {
    return { ok: false, status: 'invalid_game_id', error: 'Invalid gameId' };
  }

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('id', gameId)
    .maybeSingle();

  if (gameError) {
    console.error('[wishlist:add] game lookup Supabase error:', gameError);
    return {
      ok: false,
      status: supabaseErrorStatus(gameError),
      error: 'Could not validate game',
      detail: gameError.message,
    };
  }

  if (!game) {
    return { ok: false, status: 'game_not_found', error: 'Game not found' };
  }

  const { data, error } = await supabase
    .from('wishlist')
    .upsert(
      { user_id: userId, game_id: gameId },
      { onConflict: 'user_id,game_id', ignoreDuplicates: true }
    )
    .select('id, user_id, game_id')
    .maybeSingle();

  if (error) {
    console.error('[wishlist:add] insert Supabase error:', error);
    return {
      ok: false,
      status: supabaseErrorStatus(error),
      error: 'Could not add wishlist item',
      detail: error.message,
    };
  }

  return { ok: true, status: data ? 'added' : 'exists', item: data };
}
