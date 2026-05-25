'use client';

import type { Game } from '@/lib/supabase';
import { TOP_GAME_SEEDS, isSeedGameId } from '@/lib/top-games';
import { resolveNonSteamGameUrl } from '@/lib/game-official-sites';

export const SEED_COLLECTIONS_CHANGED = 'nexusvault-seed-collections-changed';

type CollectionName = 'library' | 'wishlist';

function storageKey(userId: string, collection: CollectionName) {
  return `nexusvault:${collection}:${userId}`;
}

function canUseStorage(userId: string) {
  return typeof window !== 'undefined' && userId !== 'guest';
}

export function readSeedCollection(userId: string, collection: CollectionName): Set<string> {
  if (!canUseStorage(userId)) return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(userId, collection));
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeSeedCollection(userId: string, collection: CollectionName, ids: Set<string>) {
  if (!canUseStorage(userId)) return;
  window.localStorage.setItem(storageKey(userId, collection), JSON.stringify(Array.from(ids)));
  window.dispatchEvent(new Event(SEED_COLLECTIONS_CHANGED));
}

export function seedCollectionGames(userId: string, collection: CollectionName): Game[] {
  const ids = readSeedCollection(userId, collection);
  return TOP_GAME_SEEDS.filter(game => ids.has(game.id));
}

export function isSeedInCollection(userId: string, collection: CollectionName, gameId: string) {
  return readSeedCollection(userId, collection).has(gameId);
}

export function addSeedToCollection(userId: string, collection: CollectionName, game: Game) {
  if (!isSeedGameId(game.id)) return false;
  const ids = readSeedCollection(userId, collection);
  ids.add(game.id);
  writeSeedCollection(userId, collection, ids);
  return true;
}

export function toggleSeedWishlist(userId: string, game: Game): boolean {
  const ids = readSeedCollection(userId, 'wishlist');
  const nextValue = !ids.has(game.id);
  if (nextValue) ids.add(game.id);
  else ids.delete(game.id);
  writeSeedCollection(userId, 'wishlist', ids);
  return nextValue;
}

export function removeSeedFromCollection(userId: string, collection: CollectionName, gameId: string) {
  const ids = readSeedCollection(userId, collection);
  ids.delete(gameId);
  writeSeedCollection(userId, collection, ids);
}

export function openGameSite(game: Game) {
  const url = resolveNonSteamGameUrl(game.slug, game.download_url);
  window.open(url, '_blank', 'noopener,noreferrer');
}
