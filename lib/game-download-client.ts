import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

/** Verifies entitlement server-side, then sends the browser to the installer URL (or same-site path). */
export async function startVerifiedDownload(supabase: SupabaseClient, slug: string): Promise<void> {
  const { data: refreshed } = await supabase.auth.refreshSession();
  const session = refreshed.session ?? (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;
  if (!token) {
    toast.error('Sign in to download');
    return;
  }
  const res = await fetch(`/api/download?slug=${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof (payload as { error?: string }).error === 'string' ? (payload as { error: string }).error : 'Download failed';
    toast.error(msg);
    return;
  }
  const url = (payload as { url?: string }).url;
  if (!url) {
    toast.error('No download is configured for this title yet.');
    return;
  }
  window.location.assign(url);
}
