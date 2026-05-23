import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jsonError, serverError } from '@/lib/server/http';
import { stripe, stripeWebhookSecret } from '@/lib/server/stripe';
import { fulfillPaidOrder, markOrderFailed } from '@/lib/server/order-service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    const event = stripe().webhooks.constructEvent(body, signature, stripeWebhookSecret());

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await fulfillPaidOrder(event.data.object);
        break;
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
        await markOrderFailed(event.data.object);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      return jsonError('Invalid Stripe signature', 400);
    }
    return serverError('stripe/webhook', err);
  }
}
