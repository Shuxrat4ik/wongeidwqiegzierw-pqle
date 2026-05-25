import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function stripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  });

  return stripeClient;
}

export function stripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  }
  return secret;
}
