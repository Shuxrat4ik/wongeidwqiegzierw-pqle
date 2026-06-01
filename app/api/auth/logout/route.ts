import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/server/session-cookies';
import { supabaseAnon } from '@/lib/server/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('sb-refresh-token')?.value;

    // 🔐 Supabase logout (agar session bo‘lsa)
    if (refreshToken) {
      await supabaseAnon.auth.signOut().catch(() => undefined);
    }

    // 🍪 Cookie tozalash
    const res = NextResponse.json({ ok: true });
    clearSessionCookies(res);

    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}