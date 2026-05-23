import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, jsonError } from '@/lib/server/http';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export type SessionUser = {
  id: string;
  email: string | null;
  role: 'user' | 'admin';
};

export type AuthGate =
  | { ok: true; supabase: SupabaseClient; user: SessionUser; rawUser: User; token: string }
  | { ok: false; response: NextResponse };

function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function cookieToken(req: NextRequest) {
  return req.cookies.get('sb-access-token')?.value ?? req.cookies.get('access_token')?.value ?? null;
}

function usernameFor(user: User) {
  const metadataUsername = typeof user.user_metadata?.username === 'string'
    ? user.user_metadata.username.trim()
    : '';
  const emailUsername = user.email?.split('@')[0]?.trim() ?? '';
  return metadataUsername || emailUsername || 'player';
}

async function ensureProfile(supabase: SupabaseClient, user: User) {
  const builtInAdmin = user.email?.toLowerCase() === 'admin@gamestore.com';
  const profilePayload = {
    id: user.id,
    email: user.email ?? '',
    username: usernameFor(user),
    avatar_url: typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '',
    is_admin: builtInAdmin,
  };

  const { data: created, error } = await supabase
    .from('profiles')
    .insert(profilePayload)
    .select('is_admin')
    .maybeSingle();

  if (!error) return created;

  console.warn('[auth] profile create with user session failed:', error.message);

  try {
    const admin = createServiceRoleClient();
    const { data: serviceCreated, error: serviceError } = await admin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('is_admin')
      .maybeSingle();

    if (serviceError) {
      console.warn('[auth] profile create with service role failed:', serviceError.message);
      return null;
    }

    return serviceCreated;
  } catch (serviceErr) {
    console.warn('[auth] profile service role unavailable:', serviceErr instanceof Error ? serviceErr.message : String(serviceErr));
    return null;
  }
}

export async function requireUser(req: NextRequest): Promise<AuthGate> {
  const env = supabaseEnv();
  if (!env) {
    return { ok: false, response: jsonError('Server missing Supabase environment variables', 500) };
  }

  const token = bearerToken(req) ?? cookieToken(req);
  if (!token) {
    console.warn('[auth] missing session token');
    return { ok: false, response: jsonError('Authentication required', 401) };
  }

  const supabase = createClient(env.url, env.anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.warn('[auth] invalid session:', error?.message ?? 'No user returned');
    return { ok: false, response: jsonError('Invalid or expired session', 401) };
  }

  console.log('[auth] user object:', user);
  console.log('[auth] user.id:', user.id);

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.warn('[auth] profile lookup:', profileError.message);
  }
  if (!profile && !profileError) {
    console.warn('[auth] profile missing, creating for user.id:', user.id);
    profile = await ensureProfile(supabase, user);
  }

  return {
    ok: true,
    supabase,
    rawUser: user,
    token,
    user: {
      id: user.id,
      email: user.email ?? null,
      role: profile?.is_admin || user.email?.toLowerCase() === 'admin@gamestore.com' ? 'admin' : 'user',
    },
  };
}

export async function requireRole(req: NextRequest, roles: Array<'user' | 'admin'>): Promise<AuthGate> {
  const gate = await requireUser(req);
  if (!gate.ok) return gate;
  if (!roles.includes(gate.user.role)) {
    return { ok: false, response: jsonError('Forbidden', 403) };
  }
  return gate;
}
