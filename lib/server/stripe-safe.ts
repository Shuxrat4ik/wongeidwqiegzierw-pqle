export function getStripeKey() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe key missing");
  }

  return process.env.STRIPE_SECRET_KEY;
}