/** Returns embeddable YouTube URL or null if not a recognized YouTube link. */
export function toYouTubeEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/embed' && u.searchParams.get('listType') === 'search' && u.searchParams.get('list')) {
        const query = u.searchParams.get('list') ?? '';
        return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1&mute=1&playsinline=1`;
      }
      if (u.pathname.startsWith('/embed/')) {
        const rest = u.pathname.slice('/embed/'.length);
        const id = rest.split('/')[0];
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1` : null;
      }
      const v = u.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}?autoplay=1&mute=1&playsinline=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isDirectVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url.trim());
}
