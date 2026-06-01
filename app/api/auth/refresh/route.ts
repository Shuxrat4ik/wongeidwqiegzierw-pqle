import { NextRequest, NextResponse } from 'next/server';
import { jsonError, serverError } from '@/lib/server/http';
import { clearSessionCookies, setSessionCookies } from '@/lib/server/session-cookies';
import { supabaseAnon } from '@/lib/server/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('sb-refresh-token')?.value;

    if (!refreshToken) {
      return jsonError('Missing refresh token', 401);
    }

    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      const res = jsonError('Refresh token expired or revoked', 401);
      clearSessionCookies(res);
      return res;
    }

    const res = NextResponse.json({ ok: true });
    setSessionCookies(res, data.session);

    return res;
  } catch (err) {
    return serverError('api/auth/refresh', err);
  }
}