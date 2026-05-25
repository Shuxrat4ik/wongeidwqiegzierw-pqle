import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

/** Verifies entitlement server-side, then sends the browser to the installer URL (or same-site path). */
export async function startVerifiedDownload(supabase: SupabaseClient, slug: string): Promise<void> {
  const { data: refreshed } = await supabase.auth.refreshSession();
  const session = refreshed.session ?? (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;
  if (!slug) {
  console.error("Slug is missing!");
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

export async function claimFreeGame(supabase: SupabaseClient, params: { gameId?: string; slug?: string }): Promise<boolean> {
  const { data: refreshed } = await supabase.auth.refreshSession();
  const session = refreshed.session ?? (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;
  if (!token) {
    toast.error('Sign in to add this game to your library');
    return false;
  }

  const res = await fetch('/api/library/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof (payload as { error?: string }).error === 'string' ? (payload as { error: string }).error : 'Could not add game to library';
    toast.error(msg);
    return false;
  }

  return true;
}

export async function claimFreeGameAndDownload(supabase: SupabaseClient, params: { gameId?: string; slug: string }): Promise<boolean> {
  const claimed = await claimFreeGame(supabase, params);
  if (!claimed) return false;
  toast.success('Added to your library');
  await startVerifiedDownload(supabase, params.slug);
  return true;
}
