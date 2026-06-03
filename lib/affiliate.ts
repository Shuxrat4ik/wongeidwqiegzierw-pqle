import type { Game } from '@/lib/supabase';

const AFFILIATE_URL = process.env.NEXT_PUBLIC_AFFILIATE_URL?.trim();
const AFFILIATE_URL_TEMPLATE = process.env.NEXT_PUBLIC_AFFILIATE_URL_TEMPLATE?.trim();

function encodeValue(value: string) {
  return encodeURIComponent(value);
}

function applyTemplate(template: string, game: Game) {
  return template
    .replaceAll('{id}', encodeValue(game.id))
    .replaceAll('{slug}', encodeValue(game.slug))
    .replaceAll('{title}', encodeValue(game.title));
}

function withGameParams(baseUrl: string, game: Game) {
  try {
    const url = new URL(baseUrl);
    if (!url.searchParams.has('game')) url.searchParams.set('game', game.slug);
    if (!url.searchParams.has('game_id')) url.searchParams.set('game_id', game.id);
    return url.toString();
  } catch {
    return null;
  }
}

export function getAffiliateUrl(game: Game) {
  if (game.affiliate_url?.trim()) return game.affiliate_url.trim();
  if (AFFILIATE_URL_TEMPLATE) return applyTemplate(AFFILIATE_URL_TEMPLATE, game);
  if (AFFILIATE_URL) return withGameParams(AFFILIATE_URL, game);
  return null;
}
