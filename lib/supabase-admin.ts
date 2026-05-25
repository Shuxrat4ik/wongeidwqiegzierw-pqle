import { createClient } from '@supabase/supabase-js';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Service-role client. Only import from server code (Route Handlers, Server Actions).
 * Never import from client components — it would bundle the secret.
 */
export function createServiceRoleClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim();

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  }
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  }

  const payload = decodeJwtPayload(key);
  if (payload && payload.role !== 'service_role') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not a service_role key');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
