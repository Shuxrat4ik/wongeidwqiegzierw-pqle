export function regionalPrice(price: number) {
  return Math.round(price * 0.8 * 100) / 100;
}

export function finalPrice(price: number, discountPercent: number) {
  return Math.round(regionalPrice(price) * (1 - discountPercent / 100) * 100) / 100;
}

export function cents(amount: number) {
  return Math.max(0, Math.round(amount * 100));
}
