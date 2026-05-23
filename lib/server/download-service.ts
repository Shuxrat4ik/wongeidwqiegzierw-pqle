import type { SupabaseClient } from '@supabase/supabase-js';

export const GAME_FILES_BUCKET = process.env.SUPABASE_GAME_FILES_BUCKET || 'game-files';
export const SIGNED_DOWNLOAD_TTL_SECONDS = 120;

export async function assertGameOwnership(
  supabase: SupabaseClient,
  userId: string,
  gameId: string
) {
  const { data, error } = await supabase
    .from('library')
    .select('id')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function createSignedGameDownload(
  admin: SupabaseClient,
  userId: string,
  params: { gameId?: string; slug?: string }
) {
  const selector = params.gameId
    ? admin
        .from('games')
        .select('id, title, slug, download_path, download_url, download_type, price')
        .eq('id', params.gameId)
    : admin
        .from('games')
        .select('id, title, slug, download_path, download_url, download_type, price')
        .eq('slug', params.slug);

  const { data: game, error: gameError } = await selector.maybeSingle();
  if (gameError) throw gameError;

  if (!game) {
    return { ok: false as const, status: 404, error: 'Game not found' };
  }

  // 🟢 FREE GAME (Google Drive)
  if (game.download_type === 'drive') {
    if (!game.download_url?.trim()) {
      return {
        ok: false as const,
        status: 400,
        error: 'No download URL configured',
      };
    }

    // log download
    await admin.from('downloads').insert({
      user_id: userId,
      game_id: game.id,
    });

    return {
      ok: true as const,
      game,
      url: game.download_url, // 🔥 direct drive link
      expiresIn: null,
    };
  }

  // 🔵 PAID GAME

  if (game.price > 0) {
    const owned = await assertGameOwnership(admin, userId, game.id);

    if (!owned) {
      return {
        ok: false as const,
        status: 403,
        error: 'You do not own this game',
      };
    }
  }

  if (!game.download_path?.trim()) {
    return {
      ok: false as const,
      status: 400,
      error: 'No private download file is configured for this game',
    };
  }

  const { data: signed, error: signedError } = await admin.storage
    .from(GAME_FILES_BUCKET)
    .createSignedUrl(game.download_path.trim(), SIGNED_DOWNLOAD_TTL_SECONDS);

  if (signedError) throw signedError;

  await admin.from('downloads').insert({
    user_id: userId,
    game_id: game.id,
  });

  return {
    ok: true as const,
    game,
    url: signed.signedUrl,
    expiresIn: SIGNED_DOWNLOAD_TTL_SECONDS,
  };
}