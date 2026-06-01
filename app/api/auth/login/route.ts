import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonError, serverError } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { setSessionCookies } from '@/lib/server/session-cookies';
import { supabaseAnon } from '@/lib/server/supabase-server';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, 'auth:login', { limit: 8, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many login attempts' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const parsed = LoginSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError('Invalid email or password', 400);
    }

    const supabase = supabaseAnon;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.session || !data.user) {
      return jsonError('Invalid email or password', 401);
    }

    const res = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });

    setSessionCookies(res, data.session);

    return res;
  } catch (err) {
    return serverError('api/auth/login', err);
  }
}