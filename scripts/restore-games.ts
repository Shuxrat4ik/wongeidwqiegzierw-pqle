import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { TOP_GAME_SEEDS } from '../lib/top-games';

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const raw = trimmed.slice(index + 1).trim();
    const value = raw.replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(join(process.cwd(), '.env.local'));
loadEnvFile(join(process.cwd(), '.env'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_KEY?.trim();

if (!url || !serviceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env/.env.local');
}

const supabase = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const restoreLimit = Number(process.env.RESTORE_GAMES_LIMIT ?? 200);
const selectedGames = TOP_GAME_SEEDS.slice(
  0,
  Number.isFinite(restoreLimit) && restoreLimit > 0 ? restoreLimit : 200
);

const rows = selectedGames.map((game) => ({
  title: game.title,
  slug: game.slug,
  short_description: game.short_description,
  description: game.description,
  cover_image: game.cover_image,
  banner_image: game.banner_image,
  screenshots: game.screenshots ?? [],
  videos: game.videos ?? [],
  trailer_url: game.trailer_url,
  genre: game.genre ?? [],
  tags: game.tags ?? [],
  developer: game.developer,
  publisher: game.publisher,
  release_date: game.release_date,
  platform: game.platform ?? ['Windows'],
  rating: game.rating,
  review_count: game.review_count,
  price: game.price,
  discount_percent: game.discount_percent,
  currency: 'USD',
  download_url: game.download_url,
  system_requirements: game.system_requirements ?? {},
  is_available: true,
}));

function withoutMissingSchemaColumns(row: Record<string, unknown>, missingColumns: Set<string>) {
  const next = { ...row };
  for (const column of missingColumns) delete next[column];
  return next;
}

async function upsertGameChunk(chunk: Array<Record<string, unknown>>, missingColumns: Set<string>) {
  const payload = chunk.map((row) => withoutMissingSchemaColumns(row, missingColumns));
  const { error } = await supabase.from('games').upsert(payload, { onConflict: 'slug' });
  if (!error) return;

  const missing = /Could not find the '([^']+)' column/.exec(error.message)?.[1];
  if (missing) {
    missingColumns.add(missing);
    console.warn(`Supabase schema is missing games.${missing}; retrying restore without that column.`);
    return upsertGameChunk(chunk, missingColumns);
  }

  throw error;
}

async function main() {
  const { count, error: countError } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true });

  if (countError) throw countError;
  console.log(`Current Supabase games: ${count ?? 0}`);

  const chunkSize = 100;
  const missingColumns = new Set<string>();
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    await upsertGameChunk(chunk, missingColumns);
    console.log(`Restored games ${index + 1}-${index + chunk.length}`);
  }

  const { data: selectedGames, error: selectedError } = await supabase
    .from('games')
    .select('id, slug, discount_percent, release_date, rating')
    .order('rating', { ascending: false })
    .limit(24);

  if (selectedError) throw selectedError;

  const hero = selectedGames?.slice(0, 6) ?? [];
  const trending = selectedGames?.slice(0, 12) ?? [];
  const newRelease = [...(selectedGames ?? [])]
    .sort((a, b) => String(b.release_date).localeCompare(String(a.release_date)))
    .slice(0, 12);
  const onSale = (selectedGames ?? []).filter((game) => Number(game.discount_percent) > 0).slice(0, 12);

  const featuredRows = [
    ...hero.map((game, sort_order) => ({ game_id: game.id, placement: 'hero', sort_order, active: true })),
    ...trending.map((game, sort_order) => ({ game_id: game.id, placement: 'trending', sort_order, active: true })),
    ...newRelease.map((game, sort_order) => ({ game_id: game.id, placement: 'new_release', sort_order, active: true })),
    ...onSale.map((game, sort_order) => ({ game_id: game.id, placement: 'on_sale', sort_order, active: true })),
  ];

  if (featuredRows.length > 0) {
    const { error: featuredError } = await supabase
      .from('featured_games')
      .upsert(featuredRows, { onConflict: 'game_id,placement' });
    if (featuredError) throw featuredError;
    console.log(`Restored ${featuredRows.length} featured storefront cards`);
  }

  const { count: finalCount, error: finalError } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true });
  if (finalError) throw finalError;
  console.log(`Supabase games after restore: ${finalCount ?? 0}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
