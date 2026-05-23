import type { SupabaseClient } from '@supabase/supabase-js';
import { isDatabaseGameId } from '@/lib/game-id';

export type AddCartItemResult =
  | { ok: true; status: 'added' | 'exists' | 'owned'; item?: { id: string; user_id: string; game_id: string } | null }
  | { ok: false; status: 'invalid_game_id' | 'game_not_found' | 'invalid_user' | 'unauthorized' | 'forbidden' | 'conflict' | 'database_error'; error: string; detail?: string };

function supabaseErrorStatus(error: { code?: string; message?: string }) {
  if (error.code === '23505') return 'conflict' as const;
  if (error.code === '23503' && error.message?.includes('user_id')) return 'invalid_user' as const;
  if (error.code === '23503' || error.code === '22P02') return 'invalid_game_id' as const;
  if (error.code === '42501') return 'forbidden' as const;
  return 'database_error' as const;
}

export async function getCartRows(supabase: SupabaseClient, userId: string, gameIds?: string[]) {
  let query = supabase
    .from('cart')
    .select('id, user_id, game_id, quantity, added_at, games(*)')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (gameIds?.length) {
    query = query.in('game_id', gameIds);
  }

  return query;
}

export async function addCartItem(supabase: SupabaseClient, userId: string, gameId: string): Promise<AddCartItemResult> {
  console.log('[cart:add] user.id:', userId);
  console.log('[cart:add] gameId:', gameId);

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
    console.error('[cart:add] game lookup Supabase error:', gameError);
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

  const { data: owned, error: ownedError } = await supabase
    .from('library')
    .select('id')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle();

  if (ownedError) {
    console.error('[cart:add] library Supabase error:', ownedError);
    return {
      ok: false,
      status: supabaseErrorStatus(ownedError),
      error: 'Could not check library',
      detail: ownedError.message,
    };
  }

  if (owned) {
    return { ok: true, status: 'owned' };
  }

  const { data, error } = await supabase
    .from('cart')
    .upsert(
      { user_id: userId, game_id: gameId },
      { onConflict: 'user_id,game_id', ignoreDuplicates: true }
    )
    .select('id, user_id, game_id')
    .maybeSingle();

  if (error) {
    console.error('[cart:add] insert Supabase error:', error);
    return {
      ok: false,
      status: supabaseErrorStatus(error),
      error: 'Could not add cart item',
      detail: error.message,
    };
  }

  return { ok: true, status: data ? 'added' : 'exists', item: data };
}

export async function removeCartItem(
  supabase: SupabaseClient,
  userId: string,
  params: { cartItemId?: string; gameId?: string }
) {
  let query = supabase.from('cart').delete().eq('user_id', userId);

  if (params.cartItemId) {
    query = query.eq('id', params.cartItemId);
  } else if (params.gameId) {
    query = query.eq('game_id', params.gameId);
  } else {
    throw new Error('cartItemId or gameId is required');
  }

  const { error } = await query;
  if (error) throw error;
}
