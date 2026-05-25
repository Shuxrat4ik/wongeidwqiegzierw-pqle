import { NextResponse } from 'next/server';

const secure = process.env.NODE_ENV === 'production';

export function setSessionCookies(res: NextResponse, session: { access_token: string; refresh_token: string; expires_in: number }) {
  res.cookies.set('sb-access-token', session.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in,
  });
  res.cookies.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookies(res: NextResponse) {
  for (const name of ['sb-access-token', 'sb-refresh-token', 'access_token', 'refresh_token']) {
    res.cookies.set(name, '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
}
