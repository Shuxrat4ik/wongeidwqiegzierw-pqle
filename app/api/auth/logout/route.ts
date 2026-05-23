import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/server/session-cookies';
import { createAnonServerClient } from '@/lib/server/supabase-server';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('sb-refresh-token')?.value;
  if (refreshToken) {
    await createAnonServerClient().auth.signOut().catch(() => undefined);
  }

  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}
