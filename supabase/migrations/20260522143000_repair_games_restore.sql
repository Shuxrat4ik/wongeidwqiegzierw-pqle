-- Repair migration for projects where the games table exists but newer catalog
-- columns/missing rows were not applied.
alter table if exists public.games
  add column if not exists videos jsonb not null default '[]'::jsonb;

create unique index if not exists games_slug_unique_idx on public.games (slug);
