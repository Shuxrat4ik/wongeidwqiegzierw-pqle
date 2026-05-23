import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/http';
import { removeCartItem } from '@/lib/server/cart-service';

export async function POST(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    const body = await req.json().catch(() => ({}));
    const cartItemId = typeof body.cartItemId === 'string' ? body.cartItemId.trim() : undefined;
    const gameId = typeof body.gameId === 'string' ? body.gameId.trim() : undefined;
    if (!cartItemId && !gameId) return jsonError('cartItemId or gameId is required', 400);

    await removeCartItem(gate.supabase, gate.user.id, { cartItemId, gameId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError('api/cart/remove', err);
  }
}
