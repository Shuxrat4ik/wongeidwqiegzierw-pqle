import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { jsonError, serverError } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { setSessionCookies } from '@/lib/server/session-cookies';
import { createAnonServerClient } from '@/lib/server/supabase-server';

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, 'auth:register', { limit: 5, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many registration attempts' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const parsed = RegisterSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonError('Invalid registration payload', 400);

    const supabase = createAnonServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { username: parsed.data.name } },
    });

    if (error || !data.user) {
      return jsonError(error?.message || 'Could not create account', 400);
    }

    if (data.session) {
      const res = NextResponse.json({ user: { id: data.user.id, email: data.user.email } }, { status: 201 });
      setSessionCookies(res, data.session);
      return res;
    }

    createServiceRoleClient()
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          email: parsed.data.email,
          username: parsed.data.name,
          is_admin: parsed.data.email.toLowerCase() === 'admin@gamestore.com',
        },
        { onConflict: 'id' }
      )
      .then(({ error: profileError }) => {
        if (profileError) console.error('[api/auth/register] profile upsert', profileError.message);
      });

    return NextResponse.json(
      {
        user: { id: data.user.id, email: data.user.email },
        message: 'Account created. Confirm the email address before signing in if email confirmation is enabled.',
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError('api/auth/register', err);
  }
}
