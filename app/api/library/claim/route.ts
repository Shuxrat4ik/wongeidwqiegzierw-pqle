import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/http';

type ClaimBody = {
  gameId?: string;
  slug?: string;
};

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    const body: ClaimBody = await req.json().catch(() => ({}));
    const gameId = typeof body.gameId === 'string' ? body.gameId.trim() : '';
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';

    if (!gameId && !slug) {
      return jsonError('gameId or slug is required', 400);
    }

    const admin = createServiceRoleClient();
    const query = admin
      .from('games')
      .select('id, title, slug, price, is_available')
      .limit(1);

    const { data: game, error: gameError } = await (gameId
      ? query.eq('id', gameId)
      : query.eq('slug', slug)
    ).maybeSingle();

    if (gameError) throw gameError;
    if (!game) return jsonError('Game not found', 404);
    if (game.is_available === false) return jsonError('Game is not available', 409);
    if (Number(game.price ?? 0) > 0) {
      return jsonError('Paid games must be purchased with Stripe Checkout', 402);
    }

    const { error: libraryError } = await admin
      .from('library')
      .upsert(
        { user_id: gate.user.id, game_id: game.id },
        { onConflict: 'user_id,game_id', ignoreDuplicates: true }
      );

    if (libraryError) throw libraryError;

    await admin
      .from('cart')
      .delete()
      .eq('user_id', gate.user.id)
      .eq('game_id', game.id);

    return NextResponse.json({
      ok: true,
      game: {
        id: game.id,
        title: game.title,
        slug: game.slug,
      },
    });
  } catch (err) {
    return serverError('api/library/claim', err);
  }
}
