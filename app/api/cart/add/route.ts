import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/http';
import { addCartItem } from '@/lib/server/cart-service';

export async function POST(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    console.log('[api/cart/add] user object:', gate.rawUser);
    console.log('[api/cart/add] user.id:', gate.user.id);

    const body = await req.json().catch(() => ({}));
    const gameId = typeof body.gameId === 'string' ? body.gameId.trim() : '';
    console.log('[api/cart/add] gameId:', gameId);

    if (!gameId) {
      return NextResponse.json({ ok: false, status: 'invalid_game_id', error: 'gameId is required' });
    }

    const result = await addCartItem(gate.supabase, gate.user.id, gameId);
    if (!result.ok) {
      console.error('[api/cart/add] controlled error:', result);
      if (result.status === 'unauthorized') return jsonError(result.error, 401, result.detail);
      if (result.status === 'forbidden') return jsonError(result.error, 403, result.detail);
      return NextResponse.json(result);
    }

    if (result.status === 'owned') {
      return NextResponse.json({ ok: false, status: 'owned', error: 'You already own this game' });
    }

    return NextResponse.json(result);
  } catch (err) {
    return serverError('api/cart/add', err);
  }
}
