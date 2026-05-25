import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { apiError, handleServerError } from '@/lib/server/error-handler';
import { finalPrice, regionalPrice, cents } from '@/lib/server/pricing';
import { rateLimit } from '@/lib/server/rate-limit';
import { requireUser } from '@/lib/server/auth';
import { stripe } from '@/lib/server/stripe';
import { checkUserOwnsGame } from '@/lib/server/ownership';
import { getOrigin } from '@/lib/server/http';

type CheckoutBody = {
  items?: Array<{ gameId?: string }>;
};

export const runtime = 'nodejs';

function isMissingGameIdColumn(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === '42703' || /game_id/i.test(error?.message ?? '');
}

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
    if (cartError) return apiError(cartError.message, 400);

    const rows = (cartRows ?? []).filter((row: any) => row.games?.is_available !== false);
    if (rows.length === 0) return apiError('Cart empty', 400);

    const admin = createServiceRoleClient();
    const ownershipChecks = await Promise.all(
      rows.map(async (row: any) => ({
        gameId: row.game_id,
        owned: await checkUserOwnsGame(admin, gate.user.id, row.game_id),
      }))
    );
    const ownedIds = new Set(ownershipChecks.filter((row) => row.owned).map((row) => row.gameId));
    const purchasable = rows.filter((row: any) => !ownedIds.has(row.game_id));
    if (purchasable.length === 0) {
      return apiError('All selected games are already owned', 409);
    }

    const freeRows = purchasable.filter((row: any) => Number(row.games.price ?? 0) === 0);
    const paidRows = purchasable.filter((row: any) => Number(row.games.price ?? 0) > 0);

    if (freeRows.length > 0) {
      const freeLibraryRows = freeRows.map((row: any) => ({
        user_id: gate.user.id,
        game_id: row.game_id,
      }));

      const { error: freeLibraryError } = await admin
        .from('library')
        .upsert(freeLibraryRows, { onConflict: 'user_id,game_id', ignoreDuplicates: true });
      if (freeLibraryError) return apiError(freeLibraryError.message, 400);

      await admin
        .from('cart')
        .delete()
        .eq('user_id', gate.user.id)
        .in('game_id', freeRows.map((row: any) => row.game_id));
    }

    if (paidRows.length === 0) {
      return NextResponse.json({
        ok: true,
        freeOnly: true,
        url: `${getOrigin(req)}/library?claim=success`,
      });
    }

    const subtotal = paidRows.reduce((sum: number, row: any) => sum + regionalPrice(Number(row.games.price ?? 0)), 0);
    const total = paidRows.reduce(
      (sum: number, row: any) => sum + finalPrice(Number(row.games.price ?? 0), Number(row.games.discount_percent ?? 0)),
      0
    );
    const discountAmount = Math.max(0, subtotal - total);

    let { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: gate.user.id,
        subtotal,
        discount_amount: discountAmount,
        total,
        total_price: total,
        currency: 'MYR',
        game_id: paidRows.length === 1 ? paidRows[0].game_id : null,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'stripe',
        notes: 'Stripe Checkout session created',
      })
      .select('id')
      .single();

    if (orderError && isMissingGameIdColumn(orderError)) {
      const retry = await admin
        .from('orders')
        .insert({
          user_id: gate.user.id,
          subtotal,
          discount_amount: discountAmount,
          total,
          total_price: total,
          currency: 'USD',
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'stripe',
          notes: 'Stripe Checkout session created',
        })
        .select('id')
        .single();
      order = retry.data;
      orderError = retry.error;
    }

    if (orderError || !order) {
      return apiError(orderError?.message || 'Could not create order', 400);
    }

    const orderId = order.id;
    const orderItems = paidRows.map((row: any) => ({
      order_id: orderId,
      game_id: row.game_id,
      game_title: row.games.title,
      price: finalPrice(Number(row.games.price ?? 0), Number(row.games.discount_percent ?? 0)),
      price_at_purchase: finalPrice(Number(row.games.price ?? 0), Number(row.games.discount_percent ?? 0)),
      discount_percent: Number(row.games.discount_percent ?? 0),
    }));

    const { error: itemsError } = await admin.from('order_items').insert(orderItems);
    if (itemsError) return apiError(itemsError.message, 400);

    const origin = getOrigin(req);
    const checkout = await stripe().checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: gate.user.email ?? undefined,
        client_reference_id: orderId,
        metadata: {
        orderId: String(orderId),
        userId: String(gate.user.id),
        gameIds: paidRows.map(r => r.game_id).join(',')
        },  
        line_items: paidRows.map((row: any) => ({
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
        success_url: `${origin}/library?checkout=success&order=${orderId}`,
        cancel_url: `${origin}/cart?checkout=cancelled&order=${orderId}`,
      },
      { idempotencyKey: `checkout:${orderId}` }
    );

    const { error: updateError } = await admin
      .from('orders')
      .update({ stripe_session_id: checkout.id })
      .eq('id', orderId);

    if (updateError) return apiError(updateError.message, 400);

    await admin.from('payments').insert({
      order_id: orderId,
      stripe_checkout_session_id: checkout.id,
      status: 'pending',
      amount: total,
      currency: 'MYR',
    });

    return NextResponse.json({ orderId, sessionId: checkout.id, url: checkout.url });
  } catch (err) {
    return handleServerError('api/checkout', err);
  }
}
