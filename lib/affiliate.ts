type AffiliateGame = {
  id: string;
  slug: string;
  title: string;
  affiliate_url?: string | null;
  download_url?: string | null;
};

const AFFILIATE_URL = process.env.NEXT_PUBLIC_AFFILIATE_URL?.trim();
const AFFILIATE_URL_TEMPLATE = process.env.NEXT_PUBLIC_AFFILIATE_URL_TEMPLATE?.trim();

export function cleanAffiliateUrl(value: string | null | undefined) {
  const url = value?.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function encodeValue(value: string) {
  return encodeURIComponent(value);
}

function applyTemplate(template: string, game: AffiliateGame) {
  return template
    .replaceAll('{id}', encodeValue(game.id))
    .replaceAll('{slug}', encodeValue(game.slug))
    .replaceAll('{title}', encodeValue(game.title));
}

function withGameParams(baseUrl: string, game: AffiliateGame) {
  try {
    const url = new URL(baseUrl);
    if (!url.searchParams.has('game')) url.searchParams.set('game', game.slug);
    if (!url.searchParams.has('game_id')) url.searchParams.set('game_id', game.id);
    return url.toString();
  } catch {
    return null;
  }
}

export function getAffiliateUrl(game: AffiliateGame) {
  const affiliateUrl = cleanAffiliateUrl(game.affiliate_url);
  if (affiliateUrl) return affiliateUrl;

  const downloadUrl = cleanAffiliateUrl(game.download_url);
  if (downloadUrl) return downloadUrl;

  if (AFFILIATE_URL_TEMPLATE) return applyTemplate(AFFILIATE_URL_TEMPLATE, game);
  if (AFFILIATE_URL) return withGameParams(AFFILIATE_URL, game);
  return null;
}
