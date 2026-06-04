export function stripe() {
  throw new Error('Stripe payments are disabled. Use per-game affiliate_url checkout instead.');
}

export function stripeWebhookSecret() {
  throw new Error('Stripe payments are disabled. Use per-game affiliate_url checkout instead.');
}
