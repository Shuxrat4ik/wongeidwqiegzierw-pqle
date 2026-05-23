import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { getOrigin, jsonError, serverError } from '@/lib/server/http';
import { finalPrice, regionalPrice, cents } from '@/lib/server/pricing';
import { rateLimit } from '@/lib/server/rate-limit';
import { requireUser } from '@/lib/server/auth';
import { stripe } from '@/lib/server/stripe';

type CheckoutBody = {
  items?: Array<{ gameId?: string }>;
};

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
        .map((item) => item.gameId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    );

    let cartQuery = gate.supabase
      .from('cart')
      .select('id, game_id, games(id, title, price, discount_percent, cover_image, is_available)')
      .eq('user_id', gate.user.id);

    if (requestedGameIds.size > 0) {
      cartQuery = cartQuery.in('game_id', [...requestedGameIds]);
    }

    const { data: cartRows, error: cartError } = await cartQuery;
    if (cartError) return jsonError(cartError.message, 400);

    const rows = (cartRows ?? []).filter((row: any) => row.games?.is_available !== false);
    if (rows.length === 0) return jsonError('Cart empty', 400);

    const gameIds = rows.map((row: any) => row.game_id);
    const { data: owned, error: ownedError } = await gate.supabase
      .from('library')
      .select('game_id')
      .eq('user_id', gate.user.id)
      .in('game_id', gameIds);

    if (ownedError) return jsonError(ownedError.message, 400);

    const ownedIds = new Set((owned ?? []).map((row: any) => row.game_id));
    const purchasable = rows.filter((row: any) => !ownedIds.has(row.game_id));
    if (purchasable.length === 0) {
      return jsonError('All selected games are already owned', 409);
    }

    const subtotal = purchasable.reduce((sum: number, row: any) => sum + regionalPrice(Number(row.games.price ?? 0)), 0);
    const total = purchasable.reduce(
      (sum: number, row: any) => sum + finalPrice(Number(row.games.price ?? 0), Number(row.games.discount_percent ?? 0)),
      0
    );
    const discountAmount = Math.max(0, subtotal - total);

    const admin = createServiceRoleClient();
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: gate.user.id,
        subtotal,
        discount_amount: discountAmount,
        total,
        total_price: total,
        currency: 'MYR',
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'stripe',
        notes: 'Stripe Checkout session created',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      return jsonError(orderError?.message || 'Could not create order', 400);
    }

    const orderItems = purchasable.map((row: any) => ({
      order_id: order.id,
      game_id: row.game_id,
      game_title: row.games.title,
      price: finalPrice(Number(row.games.price ?? 0), Number(row.games.discount_percent ?? 0)),
      price_at_purchase: finalPrice(Number(row.games.price ?? 0), Number(row.games.discount_percent ?? 0)),
      discount_percent: Number(row.games.discount_percent ?? 0),
    }));

    const { error: itemsError } = await admin.from('order_items').insert(orderItems);
    if (itemsError) return jsonError(itemsError.message, 400);

    const origin = getOrigin(req);
    const checkout = await stripe().checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: gate.user.email ?? undefined,
        client_reference_id: order.id,
        metadata: {
          orderId: order.id,
          userId: gate.user.id,
        },
        line_items: purchasable.map((row: any) => ({
          quantity: 1,
          price_data: {
            currency: 'myr',
            unit_amount: cents(finalPrice(Number(row.games.price ?? 0), Number(row.games.discount_percent ?? 0))),
            product_data: {
              name: row.games.title,
              images: row.games.cover_image ? [row.games.cover_image] : undefined,
              metadata: { gameId: row.game_id },
            },
          },
        })),
        success_url: `${origin}/library?checkout=success&order=${order.id}`,
        cancel_url: `${origin}/cart?checkout=cancelled&order=${order.id}`,
      },
      { idempotencyKey: `checkout:${order.id}` }
    );

    const { error: updateError } = await admin
      .from('orders')
      .update({ stripe_session_id: checkout.id })
      .eq('id', order.id);

    if (updateError) return jsonError(updateError.message, 400);

    await admin.from('payments').insert({
      order_id: order.id,
      stripe_checkout_session_id: checkout.id,
      status: 'pending',
      amount: total,
      currency: 'MYR',
    });

    return NextResponse.json({ orderId: order.id, sessionId: checkout.id, url: checkout.url });
  } catch (err) {
    return serverError('api/checkout', err);
  }
}
