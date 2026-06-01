import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { jsonError, serverError } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { setSessionCookies } from '@/lib/server/session-cookies';
import { supabaseAnon } from '@/lib/server/supabase-server';

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    // 🚫 Rate limit
    const limited = rateLimit(req, 'auth:register', { limit: 5, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many registration attempts' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    // 📦 Validation
    const parsed = RegisterSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError('Invalid registration payload', 400);
    }

    const { name, email, password } = parsed.data;

    // 🔐 Supabase signup (anon client)
    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: { username: name },
      },
    });

    if (error || !data.user) {
      return jsonError(error?.message || 'Could not create account', 400);
    }

    // ✅ Agar session qaytsa (email confirm o‘chiq bo‘lsa)
    if (data.session) {
      const res = NextResponse.json(
        {
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        },
        { status: 201 }
      );

      setSessionCookies(res, data.session);
      return res;
    }

    // 🧠 Profile yaratish (background)
    createServiceRoleClient()
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          email,
          username: name,
          is_admin: email.toLowerCase() === 'admin@gamestore.com',
        },
        { onConflict: 'id' }
      )
      .then(({ error: profileError }) => {
        if (profileError) {
          console.error('[api/auth/register] profile upsert', profileError.message);
        }
      });

    // 📧 Email confirmation flow
    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message:
          'Account created. Confirm the email address before signing in if email confirmation is enabled.',
      },
      { status: 201 }
    );
  } catch (err) {
    return serverError('api/auth/register', err);
  }
}