import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization');
  if (!h || !/^Bearer\s+/i.test(h)) return null;
  return h.replace(/^Bearer\s+/i, '').trim();
}

function isBuiltInAdminEmail(email?: string | null) {
  return email?.trim().toLowerCase() === 'admin@gamestore.com';
}

export type AdminGate =
  | { ok: true; admin: SupabaseClient; usingServiceRole: boolean }
  | { ok: false; response: NextResponse };

/**
 * Verifies the Bearer session is an admin, then returns a client for DB writes:
 * - If `SUPABASE_SERVICE_ROLE_KEY` is set → service role (bypasses RLS).
 * - If missing → same client as the signed-in user (RLS must allow admin writes).
 */
export async function requireAdmin(req: NextRequest): Promise<AdminGate> {
  const token = bearerToken(req);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token) {
    return { ok: false, response: NextResponse.json({ error: 'Missing Authorization: Bearer <access_token>' }, { status: 401 }) };
  }
  if (!url || !anonKey) {
    return { ok: false, response: NextResponse.json({ error: 'Server missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY' }, { status: 503 }) };
  }

  const supabaseUser = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabaseUser.auth.getUser(token);
  if (userErr || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 }) };
  }

  const { data: profile, error: profErr } = await supabaseUser
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if ((profErr || !profile?.is_admin) && !isBuiltInAdminEmail(user.email)) {
    return { ok: false, response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }

  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim()
  ) {
    try {
      const admin = createServiceRoleClient();
      return { ok: true, admin, usingServiceRole: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, response: NextResponse.json({ error: message }, { status: 503 }) };
    }
  }

  return { ok: true, admin: supabaseUser, usingServiceRole: false };
}
