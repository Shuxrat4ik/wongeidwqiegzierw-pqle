-- Expand catalog to 200 titles: 188 generated rows (nv-catalog-0001 … nv-catalog-0188)
-- plus the 12 hand-seeded games from 20260515100001_seed.sql.
-- Each row: unique Picsum image seeds (cover / banner / 4 screenshots) + rotating YouTube trailer URL.

INSERT INTO public.games (
  title,
  slug,
  short_description,
  description,
  cover_image,
  banner_image,
  screenshots,
  trailer_url,
  genre,
  tags,
  developer,
  publisher,
  release_date,
  platform,
  price,
  discount_percent,
  rating,
  review_count,
  download_url,
  is_available
)
SELECT
  'NexusVault Original #' || lpad(gs::text, 3, '0'),
  'nv-catalog-' || lpad(gs::text, 4, '0'),
  'Premium PC catalog title with unique key art, widescreen banner, four screenshots, and a showcase trailer.',
  'Part of the NexusVault 200-title library. Each listing ships deterministic unique media (Picsum seeds) and a trailer rotation suitable for storefront QA and demos.',
  'https://picsum.photos/seed/nv-cov-' || gs::text || '/600/900',
  'https://picsum.photos/seed/nv-ban-' || gs::text || '/1920/1080',
  jsonb_build_array(
    'https://picsum.photos/seed/nv-s1-' || gs::text || '/1280/720',
    'https://picsum.photos/seed/nv-s2-' || gs::text || '/1280/720',
    'https://picsum.photos/seed/nv-s3-' || gs::text || '/1280/720',
    'https://picsum.photos/seed/nv-s4-' || gs::text || '/1280/720'
  ),
  (ARRAY[
    'https://www.youtube.com/watch?v=YE7VzlLtp-4',
    'https://www.youtube.com/watch?v=eRsGyueVLvS',
    'https://www.youtube.com/watch?v=_MXtbjwsz3A',
    'https://www.youtube.com/watch?v=RUR_kskFq0c',
    'https://www.youtube.com/watch?v=a4FIS360yQk',
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://www.youtube.com/watch?v=LbTuID_WC6w',
    'https://www.youtube.com/watch?v=0S93nWGeekI',
    'https://www.youtube.com/watch?v=HgzGwKwLmgM',
    'https://www.youtube.com/watch?v=WhWc3lidSK8',
    'https://www.youtube.com/watch?v=GPnGrt8ZvFc',
    'https://www.youtube.com/watch?v=Ztb2xb1Uh-4',
    'https://www.youtube.com/watch?v=tkzY_VwmcK8',
    'https://www.youtube.com/watch?v=9bZkp7q19f0',
    'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    'https://www.youtube.com/watch?v=OPf0YbXqDm0',
    'https://www.youtube.com/watch?v=YQHsXMglC9A',
    'https://www.youtube.com/watch?v=ktvTqknDZU8',
    'https://www.youtube.com/watch?v=RgKAFK5djSk',
    'https://www.youtube.com/watch?v=JGwWNGJdvx8'
  ])[mod(gs - 1, 20) + 1],
  ARRAY[
    (ARRAY['Action', 'RPG', 'Indie', 'Strategy', 'Simulation', 'Adventure', 'Puzzle', 'Sports'])[mod(gs - 1, 8) + 1],
    (ARRAY['RPG', 'Indie', 'Strategy', 'Simulation', 'Adventure', 'Puzzle', 'Sports', 'Action'])[mod(gs, 8) + 1]
  ]::text[],
  ARRAY[
    (ARRAY['Co-op', 'Story Rich', 'Roguelike', 'Tactical', 'Horror', 'Sci-Fi', 'Fantasy', 'Racing'])[mod(gs + 1, 8) + 1],
    (ARRAY['Singleplayer', 'Multiplayer', 'Open World', 'Crafting', 'PvP', 'Atmospheric', 'Retro', 'VR'])[mod(gs + 3, 8) + 1],
    (ARRAY['Early Access', 'Full Release', 'Remaster', 'DLC', 'Soundtrack', 'Controller', 'Ultrawide', 'Raytracing'])[mod(gs + 5, 8) + 1]
  ]::text[],
  (ARRAY[
    'Arclight Labs', 'Nova Byte Studio', 'Helix Forge', 'Echo Drift', 'Prism Nine', 'Vectorloom', 'Iron Nebula', 'Pulse Foundry',
    'Skyline Arcade', 'Obsidian Koi', 'Northwind Interactive', 'Cinder Cone', 'Binary Bloom', 'Starforge North', 'Glass Shark', 'Neon Tundra'
  ])[mod(gs - 1, 16) + 1],
  (ARRAY[
    'NexusVault Publishing', 'Continuum Games', 'Helios Digital', 'Aurora Press', 'Signal Peak', 'Vertex Arcade', 'Orbitlane', 'Quasar Co'
  ])[mod(gs, 8) + 1],
  (CURRENT_DATE - (mod(gs * 37, 2500) * INTERVAL '1 day'))::date,
  ARRAY['Windows']::text[],
  round((9.99 + mod(gs * 13, 6000) / 100.0)::numeric, 2),
  CASE WHEN mod(gs, 11) = 0 THEN mod(gs * 7, 45) ELSE 0 END,
  round((3.6 + mod(gs * 17, 140) / 100.0)::numeric, 2),
  120 + mod(gs * 59, 18000),
  'https://store.nexusvault.example/play/' || lpad(gs::text, 4, '0'),
  true
FROM generate_series(1, 188) AS gs
ON CONFLICT (slug) DO NOTHING;

-- Category links for generated catalog rows
INSERT INTO public.game_categories (game_id, category_id)
SELECT g.id, c.id
FROM public.games g
JOIN LATERAL (
  SELECT id
  FROM public.categories
  ORDER BY sort_order
  OFFSET mod(abs(hashtext(g.slug)), 7)
  LIMIT 1
) c ON true
WHERE g.slug LIKE 'nv-catalog-%'
ON CONFLICT (game_id, category_id) DO NOTHING;
-- Extra featured placements from new catalog (does not remove existing featured rows)
INSERT INTO public.featured_games (game_id, placement, sort_order, active)
SELECT id, 'trending', row_number() OVER (ORDER BY slug), true
FROM (
  SELECT id, slug
  FROM public.games
  WHERE slug LIKE 'nv-catalog-%'
  ORDER BY slug
  LIMIT 40
) pick
ON CONFLICT (game_id, placement) DO NOTHING;

INSERT INTO public.featured_games (game_id, placement, sort_order, active)
SELECT id, 'new_release', row_number() OVER (ORDER BY release_date DESC, slug), true
FROM (
  SELECT id, slug, release_date
  FROM public.games
  WHERE slug LIKE 'nv-catalog-%'
  ORDER BY release_date DESC, slug
  LIMIT 30
) pick
ON CONFLICT (game_id, placement) DO NOTHING;

INSERT INTO public.featured_games (game_id, placement, sort_order, active)
SELECT id, 'on_sale', row_number() OVER (ORDER BY discount_percent DESC, slug), true
FROM (
  SELECT id, slug, discount_percent
  FROM public.games
  WHERE slug LIKE 'nv-catalog-%' AND discount_percent > 0
  ORDER BY discount_percent DESC, slug
  LIMIT 35
) pick
ON CONFLICT (game_id, placement) DO NOTHING;

-- Ensure hand-seeded titles also have trailer + rich screenshots when missing
UPDATE public.games g
SET
  trailer_url = coalesce(
    g.trailer_url,
    (ARRAY[
      'https://www.youtube.com/watch?v=YE7VzlLtp-4',
      'https://www.youtube.com/watch?v=_MXtbjwsz3A',
      'https://www.youtube.com/watch?v=eRsGyueVLvS',
      'https://www.youtube.com/watch?v=RUR_kskFq0c',
      'https://www.youtube.com/watch?v=a4FIS360yQk'
    ])[mod(abs(hashtext(g.slug::text)), 5) + 1]
  ),
  screenshots = CASE
    WHEN coalesce(jsonb_array_length(g.screenshots), 0) >= 3 THEN g.screenshots
    ELSE jsonb_build_array(
      'https://picsum.photos/seed/' || g.slug || '-x1/1280/720',
      'https://picsum.photos/seed/' || g.slug || '-x2/1280/720',
      'https://picsum.photos/seed/' || g.slug || '-x3/1280/720'
    )
  END
WHERE g.slug NOT LIKE 'nv-catalog-%';
