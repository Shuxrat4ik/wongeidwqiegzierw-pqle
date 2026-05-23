import Stripe from 'stripe';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export async function fulfillPaidOrder(session: Stripe.Checkout.Session) {
  const admin = createServiceRoleClient();
  const orderId = session.metadata?.orderId || session.client_reference_id;
  const userId = session.metadata?.userId;
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

  if (!orderId || !userId) {
    throw new Error('Stripe session missing orderId or userId metadata');
  }

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, user_id, total, total_price, currency, status, payment_status, stripe_session_id')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) throw new Error(`Order not found: ${orderId}`);
  if (order.user_id !== userId) throw new Error('Order user mismatch');
  if (order.status === 'completed' || order.payment_status === 'paid') return;

  const { data: items, error: itemsError } = await admin
    .from('order_items')
    .select('game_id')
    .eq('order_id', orderId)
    .not('game_id', 'is', null);

  if (itemsError) throw itemsError;

  const libraryRows = (items ?? []).map((item: any) => ({
    user_id: userId,
    game_id: item.game_id,
  }));

  if (libraryRows.length > 0) {
    const { error: libraryError } = await admin
      .from('library')
      .upsert(libraryRows, { onConflict: 'user_id,game_id', ignoreDuplicates: true });
    if (libraryError) throw libraryError;
  }

  const amount = Number(order.total ?? order.total_price ?? 0);

  const { error: paymentError } = await admin.from('payments').upsert(
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
  if (paymentError) throw paymentError;

  const { error: orderUpdateError } = await admin
    .from('orders')
    .update({
      status: 'completed',
      payment_status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      notes: 'Paid by Stripe Checkout webhook',
    })
    .eq('id', orderId);
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
      .in('game_id', libraryRows.map((row) => row.game_id));
  }
}

export async function markOrderFailed(session: Stripe.Checkout.Session) {
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
