import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'Stripe payments are disabled. Configure per-game affiliate_url instead.' },
    { status: 410 }
  );
}
