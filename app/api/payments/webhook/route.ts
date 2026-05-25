import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jsonError, serverError } from '@/lib/server/http';
import { stripe, stripeWebhookSecret } from '@/lib/server/stripe';
import { fulfillPaidOrder, markOrderFailed } from '@/lib/server/order-service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('🔥 WEBHOOK REQUEST RECEIVED');

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing stripe-signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = stripeWebhookSecret();

    console.log('🔐 WEBHOOK SECRET EXISTS:', !!secret);

    let event: Stripe.Event;

    // =========================
    // STRIPE VERIFY (FIXED BLOCK)
    // =========================
    try {
      event = stripe().webhooks.constructEvent(
        body,
        signature,
        secret
      );
    } catch (err) {
      console.error('❌ Stripe signature verification FAILED');
      console.error(err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('🔥 WEBHOOK HIT:', event.type);

    // =========================
    // PAYMENT SUCCESS
    // =========================
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId =
        session.metadata?.orderId || session.client_reference_id;

      const userId = session.metadata?.userId;

      console.log('📦 SESSION DEBUG:', {
        sessionId: session.id,
        orderId,
        userId,
        metadata: session.metadata,
        client_reference_id: session.client_reference_id,
      });

      if (!orderId || !userId) {
        console.error('❌ Missing orderId/userId');
        return NextResponse.json({ received: true });
      }

      try {
        console.log('🚀 Running fulfillPaidOrder...');
        await fulfillPaidOrder(session);
        console.log('✅ fulfillPaidOrder SUCCESS');
      } catch (err) {
        console.error('❌ fulfillPaidOrder ERROR:', err);
      }
    }

    // =========================
    // PAYMENT FAILED
    // =========================
    if (
      event.type === 'checkout.session.async_payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId =
        session.metadata?.orderId || session.client_reference_id;

      if (orderId) {
        try {
          console.log('❌ Marking order FAILED:', orderId);
          await markOrderFailed(session);
        } catch (err) {
          console.error('❌ markOrderFailed ERROR:', err);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ WEBHOOK GLOBAL ERROR:', err);

    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      return jsonError('Invalid Stripe signature', 400);
    }

    return serverError('stripe/webhook', err);
  }
}