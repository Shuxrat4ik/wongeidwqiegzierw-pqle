import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/server/auth';
import { getOrigin, jsonError, serverError } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { getAffiliateUrl } from '@/lib/affiliate';

type CheckoutBody = {
  items?: Array<{ gameId?: string }>;
};

type CartRow = {
  game_id: string;
  games: {
    id: string;
    title: string;
    slug: string;
    price: number | null;
    affiliate_url: string | null;
    download_url: string | null;
    is_available: boolean | null;
  } | null;
};

type CheckoutGame = NonNullable<CartRow['games']>;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, 'checkout', { limit: 20, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many checkout attempts' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    let body: CheckoutBody = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const requestedGameIds = new Set(
      (body.items ?? [])
        .map(item => item.gameId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    );

    const admin = createServiceRoleClient();
    let rows: CartRow[] = [];

    if (requestedGameIds.size > 0) {
      const { data: games, error: gamesError } = await admin
        .from('games')
        .select('id, title, slug, price, affiliate_url, download_url, is_available')
        .in('id', [...requestedGameIds]);

      if (gamesError) return jsonError(gamesError.message, 400);

      rows = ((games ?? []) as CheckoutGame[])
        .filter(game => game.is_available !== false)
        .map(game => ({ game_id: game.id, games: game }));
    } else {
      const { data: cartRows, error: cartError } = await gate.supabase
        .from('cart')
        .select('game_id, games(id, title, slug, price, affiliate_url, download_url, is_available)')
        .eq('user_id', gate.user.id);

      if (cartError) return jsonError(cartError.message, 400);

      rows = ((cartRows ?? []) as unknown as CartRow[]).filter(
        row => row.games && row.games.is_available !== false
      );
    }
    if (rows.length === 0) return jsonError('Cart empty', 400);

    const gameIds = rows.map(row => row.game_id);
    const { data: ownedRows, error: ownedError } = await admin
      .from('library')
      .select('game_id')
      .eq('user_id', gate.user.id)
      .in('game_id', gameIds);

    if (ownedError) return jsonError(ownedError.message, 400);

    const ownedIds = new Set((ownedRows ?? []).map((row: any) => row.game_id));
    const purchasable = rows.filter(row => !ownedIds.has(row.game_id));
    if (purchasable.length === 0) {
      return jsonError('All selected games are already owned', 409);
    }

    const freeRows = purchasable.filter(row => Number(row.games?.price ?? 0) === 0);
    const paidRows = purchasable.filter(row => Number(row.games?.price ?? 0) > 0);

    if (freeRows.length > 0) {
      const { error: freeLibraryError } = await admin
        .from('library')
        .upsert(
          freeRows.map(row => ({ user_id: gate.user.id, game_id: row.game_id })),
          { onConflict: 'user_id,game_id', ignoreDuplicates: true }
        );

      if (freeLibraryError) return jsonError(freeLibraryError.message, 400);

      await admin
        .from('cart')
        .delete()
        .eq('user_id', gate.user.id)
        .in('game_id', freeRows.map(row => row.game_id));
    }

    if (paidRows.length === 0) {
      return NextResponse.json({
        ok: true,
        freeOnly: true,
        url: `${getOrigin(req)}/library?claim=success`,
      });
    }

    const affiliateLinks = paidRows
      .map(row => ({
        gameId: row.game_id,
        title: row.games?.title ?? 'Game',
        url: row.games ? getAffiliateUrl(row.games) : null,
      }))
      .filter((row): row is { gameId: string; title: string; url: string } => Boolean(row.url));

    if (affiliateLinks.length === 0) {
      return jsonError('No affiliate URL is configured for selected paid games', 400);
    }

    return NextResponse.json({
      ok: true,
      affiliateOnly: true,
      url: affiliateLinks[0].url,
      links: affiliateLinks,
    });
  } catch (err) {
    return serverError('api/checkout', err);
  }
}
