import { createServiceRoleClient } from '@/lib/supabase-admin';

type CheckoutSession = {
  id: string;
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id?: string | null } | null;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
};

function isMissingGameIdColumn(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' || /game_id/i.test(error?.message ?? '');
}

type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function logSupabaseResult(
  label: string,
  context: Record<string, unknown>,
  result: { data?: unknown; error?: SupabaseErrorLike | null }
) {
  console.log(label, {
    ...context,
    data: result.data ?? null,
    error: result.error
      ? {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
        }
      : null,
  });
}

export async function fulfillPaidOrder(session: CheckoutSession) {
  const admin = createServiceRoleClient();
  const orderId = session.metadata?.orderId || session.client_reference_id;
  const metadataUserId = session.metadata?.userId;
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

  if (!orderId) {
    throw new Error('Stripe session missing orderId metadata and client_reference_id');
  }

  let { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, user_id, game_id, total, total_price, currency, status, payment_status, stripe_session_id')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError && isMissingGameIdColumn(orderError)) {
    const retry = await admin
      .from('orders')
      .select('id, user_id, total, total_price, currency, status, payment_status, stripe_session_id')
      .eq('id', orderId)
      .maybeSingle();
    order = retry.data ? { ...retry.data, game_id: null } : null;
    orderError = retry.error;
  }

  if (orderError) throw orderError;
  if (!order) throw new Error(`Order not found: ${orderId}`);
  if (metadataUserId && order.user_id !== metadataUserId) throw new Error('Order user mismatch');

  const userId = order.user_id;

  const { data: items, error: itemsError } = await admin
    .from('order_items')
    .select('game_id')
    .eq('order_id', orderId)
    .not('game_id', 'is', null);

  logSupabaseResult('📦 ORDER ITEMS RESULT', { orderId }, { data: items, error: itemsError });
  if (itemsError) throw itemsError;

  const gameIds = Array.from(new Set([
    ...(items ?? []).map((item: any) => item.game_id),
    ...(session.metadata?.gameIds ?? '').split(','),
  ].filter((gameId: unknown): gameId is string => typeof gameId === 'string' && gameId.length > 0)));

  const libraryRows = gameIds.map((gameId) => ({
    user_id: userId,
    game_id: gameId,
  }));

  console.log('📚 LIBRARY UPSERT INPUT', {
    orderId,
    userId,
    gameIds,
    rows: libraryRows,
  });

  if (libraryRows.length > 0) {
    const libraryResult = await admin
      .from('library')
      .upsert(libraryRows, { onConflict: 'user_id,game_id' })
      .select('id,user_id,game_id,acquired_at');

    logSupabaseResult('📚 LIBRARY UPSERT RESULT', { orderId, userId }, libraryResult);
    if (libraryResult.error) throw libraryResult.error;

    const returnedGameIds = new Set((libraryResult.data ?? []).map((row: any) => row.game_id));
    const missingGameIds = gameIds.filter((gameId) => !returnedGameIds.has(gameId));
    if (missingGameIds.length > 0) {
      throw new Error(`Library upsert returned no rows for game IDs: ${missingGameIds.join(', ')}`);
    }
  }

  const amount = Number(order.total ?? order.total_price ?? 0);

  const paymentResult = await admin.from('payments').upsert(
    {
      order_id: orderId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      amount,
      currency: String(order.currency ?? 'MYR'),
      status: 'completed',
      raw_event: {
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
      },
    },
    { onConflict: 'stripe_checkout_session_id' }
  );
  logSupabaseResult('💳 PAYMENT UPSERT RESULT', { orderId, sessionId: session.id }, paymentResult);
  if (paymentResult.error) throw paymentResult.error;

  let { error: orderUpdateError } = await admin
    .from('orders')
    .update({
      game_id: order.game_id ?? (gameIds.length === 1 ? gameIds[0] : null),
      status: 'completed',
      payment_status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      notes: 'Paid by Stripe Checkout webhook',
    })
    .eq('id', orderId);
  if (orderUpdateError && isMissingGameIdColumn(orderUpdateError)) {
    const retry = await admin
      .from('orders')
      .update({
        status: 'completed',
        payment_status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        notes: 'Paid by Stripe Checkout webhook',
      })
      .eq('id', orderId);
    orderUpdateError = retry.error;
  }
  if (orderUpdateError) throw orderUpdateError;

  await admin.from('transactions').upsert(
    {
      user_id: userId,
      order_id: orderId,
      amount,
      type: 'payment',
      status: 'completed',
      payment_method: 'stripe',
      gateway_response: {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
      },
    },
    { onConflict: 'order_id,type' }
  );

  if (libraryRows.length > 0) {
    await admin
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .in('game_id', gameIds);
  }
}

export async function markOrderFailed(session: CheckoutSession) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) return;

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

  const admin = createServiceRoleClient();
  await admin
    .from('orders')
    .update({
      status: 'failed',
      payment_status: 'pending',
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      notes: 'Stripe payment failed or expired',
    })
    .eq('id', orderId)
    .eq('status', 'pending');

  await admin.from('payments').upsert(
    {
      order_id: orderId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      status: 'failed',
      raw_event: {
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
      },
    },
    { onConflict: 'stripe_checkout_session_id' }
  );
}
