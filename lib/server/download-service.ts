import type { SupabaseClient } from '@supabase/supabase-js';
import { checkR2Object, createR2SignedUrl, publicR2Url, validateR2Config } from '@/lib/r2';
import { checkUserOwnsGame } from '@/lib/server/ownership';

export const SIGNED_DOWNLOAD_TTL_SECONDS = 120;

async function recordDownload(admin: SupabaseClient, userId: string, gameId: string) {
  const { error } = await admin.from('downloads').insert({
    user_id: userId,
    game_id: gameId,
  });

  if (error) {
    console.warn('[download] could not record download:', error.message);
  }
}

export async function createSignedGameDownload(
  admin: SupabaseClient,
  userId: string,
  params: { gameId?: string; slug?: string }
) {
  try {
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

    if (gameError) {
      console.error("DB ERROR:", gameError);
      return { ok: false as const, status: 502, error: 'Could not load game data' };
    }

    if (!game) {
      return { ok: false as const, status: 404, error: 'Game not found' };
    }

    const owned = await checkUserOwnsGame(admin, userId, game.id);

    if (!owned) {
      return {
        ok: false as const,
        status: 403,
        error:
          game.price > 0
            ? 'You do not own this game'
            : 'Add this free game to your library first',
      };
    }

    if (game.download_type === 'drive' || game.download_type === 'external') {
      if (!game.download_url?.trim()) {
        return {
          ok: false as const,
          status: 400,
          error: 'No download URL configured',
        };
      }

      await recordDownload(admin, userId, game.id);

      return {
        ok: true as const,
        game,
        url: game.download_url,
        expiresIn: null,
      };
    }

    if (!game.download_path?.trim()) {
      return {
        ok: false as const,
        status: 400,
        error: 'No private download file is configured for this game',
      };
    }

    const path = game.download_path.trim().replace(/^\/+/, '');
    
    // Check R2 config before attempting to create signed URL
    const r2Check = validateR2Config();
    if (!r2Check.ok) {
      console.error('[download] R2 configuration error:', r2Check.error);
      return {
        ok: false as const,
        status: 503,
        error: 'Download service unavailable: ' + r2Check.error,
      };
    }

    try {
      const objectCheck = await checkR2Object(path);
      if (!objectCheck.ok) {
        return {
          ok: false as const,
          status: objectCheck.status,
          error: `${objectCheck.error}: ${objectCheck.key}`,
        };
      }

      const url = publicR2Url(path) ?? createR2SignedUrl(path, SIGNED_DOWNLOAD_TTL_SECONDS);
      await recordDownload(admin, userId, game.id);

      return {
        ok: true as const,
        game,
        url,
        expiresIn: publicR2Url(path) ? null : SIGNED_DOWNLOAD_TTL_SECONDS,
      };
    } catch (r2Error) {
      console.error('[download] R2 signed URL creation failed:', r2Error instanceof Error ? r2Error.message : r2Error);
      return {
        ok: false as const,
        status: 502,
        error: 'Could not generate download URL',
      };
    }

  } catch (err) {
    console.error("FATAL DOWNLOAD ERROR:", err);
    const message = err instanceof Error ? err.message : 'Download failed';
    const isConfigError = message.includes('environment variables') || message.includes('secret key');

    return {
      ok: false as const,
      status: isConfigError ? 503 : 502,
      error: message,
    };
  }
}
