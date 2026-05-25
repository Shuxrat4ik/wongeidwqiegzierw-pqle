import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/http';
import { addWishlistItem } from '@/lib/server/wishlist-service';

export async function POST(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    console.log('[api/wishlist/add] user object:', gate.rawUser);
    console.log('[api/wishlist/add] user.id:', gate.user.id);

    const body = await req.json().catch(() => ({}));
    const gameId = typeof body.gameId === 'string' ? body.gameId.trim() : '';
    console.log('[api/wishlist/add] gameId:', gameId);

    if (!gameId) {
      return NextResponse.json({ ok: false, status: 'invalid_game_id', error: 'gameId is required' });
    }

    const result = await addWishlistItem(gate.supabase, gate.user.id, gameId);
    if (!result.ok) {
      console.error('[api/wishlist/add] controlled error:', result);
      if (result.status === 'unauthorized') return jsonError(result.error, 401, result.detail);
      if (result.status === 'forbidden') return jsonError(result.error, 403, result.detail);
      return NextResponse.json(result);
    }

    return NextResponse.json(result);
  } catch (err) {
    return serverError('api/wishlist/add', err);
  }
}
