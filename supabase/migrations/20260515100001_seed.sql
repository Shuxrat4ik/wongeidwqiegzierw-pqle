-- Seed catalog, category links, and featured placements for NexusVault.

INSERT INTO public.categories (name, slug, description, color, sort_order) VALUES
  ('Action', 'action', 'Combat-focused experiences', '#f97316', 1),
  ('RPG', 'rpg', 'Progression, loot, and deep stories', '#a855f7', 2),
  ('Strategy', 'strategy', 'Tactics and long-term planning', '#eab308', 3),
  ('Puzzle', 'puzzle', 'Clever mechanics and brain-teasers', '#22d3ee', 4),
  ('Indie', 'indie', 'Hand-crafted games from smaller studios', '#2dd4bf', 5),
  ('Adventure', 'adventure', 'Exploration and narrative journeys', '#3b82f6', 6),
  ('Simulation', 'simulation', 'Systems, crafting, and life sims', '#22c55e', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.games (
  title, slug, short_description, description,
  cover_image, banner_image, screenshots,
  genre, tags, developer, publisher, release_date,
  platform, price, discount_percent, rating, review_count,
  download_url, is_available
) VALUES
(
  'Elden Ring',
  'elden-ring',
  'An open-world action RPG of uncompromising vision.',
  'Traverse the Lands Between, face legendary foes, and define your path in a shattered realm.',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=1080&fit=crop',
  '["https://images.unsplash.com/photo-1538481199705-a710002fcda1?w=1200&h=675&fit=crop"]'::jsonb,
  ARRAY['Action','RPG']::text[],
  ARRAY['Soulslike','Open World']::text[],
  'FromSoftware', 'Bandai Namco', '2022-02-25',
  ARRAY['Windows']::text[], 59.99, 0, 4.8, 12000,
  'https://en.bandainamcoent.eu/elden-ring/elden-ring', true
),
(
  'Baldur''s Gate 3',
  'baldurs-gate-3',
  'A narrative RPG shaped by choice, dice, and companions.',
  'Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal.',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['RPG','Adventure']::text[],
  ARRAY['CRPG','Co-op']::text[],
  'Larian Studios', 'Larian Studios', '2023-08-03',
  ARRAY['Windows','macOS']::text[], 59.99, 10, 4.9, 18000,
  'https://baldursgate3.game/', true
),
(
  'Cyberpunk 2077',
  'cyberpunk-2077',
  'A first-person RPG set in the neon sprawl of Night City.',
  'Become a cyber-enhanced mercenary and survive a city obsessed with power and body modification.',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Action','RPG']::text[],
  ARRAY['Sci-Fi','FPS']::text[],
  'CD Projekt Red', 'CD Projekt', '2020-12-10',
  ARRAY['Windows']::text[], 39.99, 25, 4.4, 9000,
  'https://www.cyberpunk.net/', true
),
(
  'Hades',
  'hades',
  'Escape the underworld in this fast-paced roguelike.',
  'Defy the god of death as you hack and slash out of Greek myth.',
  'https://images.unsplash.com/photo-1493711661312-eaef3de0ffcd?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Action','Indie']::text[],
  ARRAY['Roguelike']::text[],
  'Supergiant Games', 'Supergiant Games', '2020-09-17',
  ARRAY['Windows','macOS']::text[], 24.99, 0, 4.8, 11000,
  'https://www.supergiantgames.com/games/hades/', true
),
(
  'Stardew Valley',
  'stardew-valley',
  'Farming, friendship, and cozy seasons in Pelican Town.',
  'Inherit your grandfather''s farm and build the life you want.',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Simulation','Indie']::text[],
  ARRAY['Cozy','Crafting']::text[],
  'ConcernedApe', 'ConcernedApe', '2016-02-26',
  ARRAY['Windows','macOS']::text[], 14.99, 0, 4.9, 24000,
  'https://www.stardewvalley.net/', true
),
(
  'Portal 2',
  'portal-2',
  'Mind-bending puzzles with portals, humor, and co-op labs.',
  'Think with portals in a campaign and cooperative challenges.',
  'https://images.unsplash.com/photo-1633613286991-611fe299c4be?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Puzzle']::text[],
  ARRAY['Sci-Fi','Co-op']::text[],
  'Valve', 'Valve', '2011-04-19',
  ARRAY['Windows','macOS']::text[], 9.99, 15, 4.9, 20000,
  'https://store.steampowered.com/app/620/', true
),
(
  'The Witcher 3: Wild Hunt',
  'witcher-3',
  'Open-world fantasy RPG starring Geralt of Rivia.',
  'Monster contracts, morally gray quests, and two massive expansions worth of adventure.',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['RPG','Adventure']::text[],
  ARRAY['Open World']::text[],
  'CD Projekt Red', 'CD Projekt', '2015-05-19',
  ARRAY['Windows']::text[], 29.99, 40, 4.8, 32000,
  'https://thewitcher.com/en/witcher3', true
),
(
  'Hollow Knight',
  'hollow-knight',
  'Metroidvania masterpiece beneath a dying kingdom.',
  'Chart forgotten roads, duel corrupted creatures, and uncover ancient secrets.',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1538481199705-a710002fcda1?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Action','Indie','Adventure']::text[],
  ARRAY['Metroidvania']::text[],
  'Team Cherry', 'Team Cherry', '2017-02-24',
  ARRAY['Windows','macOS']::text[], 14.99, 0, 4.8, 16000,
  'https://www.hollowknight.com/', true
),
(
  'Slay the Spire',
  'slay-the-spire',
  'Deck-building roguelike where every run reshapes your strategy.',
  'Ascend the spire with evolving card combos and relic synergies.',
  'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Strategy','Indie']::text[],
  ARRAY['Deckbuilder']::text[],
  'Mega Crit', 'Mega Crit', '2019-01-23',
  ARRAY['Windows','macOS']::text[], 24.99, 20, 4.7, 9000,
  'https://www.megacrit.com/', true
),
(
  'Fortnite',
  'fortnite',
  'Fast-paced battle royale with evolving seasons and events.',
  'Drop in, squad up, and compete across constantly refreshed islands.',
  'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Action']::text[],
  ARRAY['Battle Royale','Free']::text[],
  'Epic Games', 'Epic Games', '2017-07-25',
  ARRAY['Windows','macOS']::text[], 0, 0, 4.2, 80000,
  'https://www.fortnite.com/', true
),
(
  'Valheim',
  'valheim',
  'Viking survival co-op in a stylized procedural world.',
  'Sail, build, and conquer biomes with friends.',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Adventure','Simulation']::text[],
  ARRAY['Survival','Co-op']::text[],
  'Iron Gate AB', 'Coffee Stain Publishing', '2021-02-02',
  ARRAY['Windows']::text[], 19.99, 0, 4.6, 14000,
  'https://www.valheimgame.com/', true
),
(
  'Control',
  'control',
  'Supernatural third-person action inside the Oldest House.',
  'Wield shifting architecture and paranatural abilities in a mystery-thriller setting.',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1920&h=1080&fit=crop',
  '[]'::jsonb,
  ARRAY['Action','Adventure']::text[],
  ARRAY['Third Person']::text[],
  'Remedy Entertainment', '505 Games', '2019-08-27',
  ARRAY['Windows']::text[], 29.99, 35, 4.3, 7000,
  'https://www.remedygames.com/games/control/', true
)
ON CONFLICT (slug) DO NOTHING;

-- Category links (by slug)
INSERT INTO public.game_categories (game_id, category_id)
SELECT g.id, c.id
FROM public.games g
JOIN public.categories c ON (
  (g.slug = 'elden-ring' AND c.slug IN ('action','rpg')) OR
  (g.slug = 'baldurs-gate-3' AND c.slug IN ('rpg','adventure')) OR
  (g.slug = 'cyberpunk-2077' AND c.slug IN ('action','rpg')) OR
  (g.slug = 'hades' AND c.slug IN ('action','indie')) OR
  (g.slug = 'stardew-valley' AND c.slug IN ('simulation','indie')) OR
  (g.slug = 'portal-2' AND c.slug = 'puzzle') OR
  (g.slug = 'witcher-3' AND c.slug IN ('rpg','adventure')) OR
  (g.slug = 'hollow-knight' AND c.slug IN ('action','indie','adventure')) OR
  (g.slug = 'slay-the-spire' AND c.slug IN ('strategy','indie')) OR
  (g.slug = 'fortnite' AND c.slug = 'action') OR
  (g.slug = 'valheim' AND c.slug IN ('adventure','simulation')) OR
  (g.slug = 'control' AND c.slug IN ('action','adventure'))
)
ON CONFLICT (game_id, category_id) DO NOTHING;

-- Featured rows (placements match admin UI + storefront)
INSERT INTO public.featured_games (game_id, placement, sort_order, active)
SELECT id, 'hero', ROW_NUMBER() OVER (ORDER BY rating DESC, title), true
FROM public.games
ORDER BY rating DESC, title
LIMIT 4
ON CONFLICT (game_id, placement) DO NOTHING;

INSERT INTO public.featured_games (game_id, placement, sort_order, active)
SELECT id, 'trending', ROW_NUMBER() OVER (ORDER BY review_count DESC), true
FROM public.games
ORDER BY review_count DESC
LIMIT 6
ON CONFLICT (game_id, placement) DO NOTHING;

INSERT INTO public.featured_games (game_id, placement, sort_order, active)
SELECT id, 'new_release', ROW_NUMBER() OVER (ORDER BY release_date DESC), true
FROM public.games
ORDER BY release_date DESC
LIMIT 6
ON CONFLICT (game_id, placement) DO NOTHING;

INSERT INTO public.featured_games (game_id, placement, sort_order, active)
SELECT id, 'on_sale', ROW_NUMBER() OVER (ORDER BY discount_percent DESC, title), true
FROM public.games
WHERE discount_percent > 0
ORDER BY discount_percent DESC, title
LIMIT 8
ON CONFLICT (game_id, placement) DO NOTHING;
