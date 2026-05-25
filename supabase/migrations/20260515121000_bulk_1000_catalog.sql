DO $$
DECLARE
  existing_count int := (SELECT COUNT(*) FROM public.games);
  to_add int := GREATEST(0, 1000 - existing_count);
BEGIN
  IF to_add <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.games (
    title,
    slug,
    short_description,
    description,
    cover_image,
    banner_image,
    screenshots,
    trailer_url,
    videos,
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
    is_available,
    system_requirements
  )
  SELECT
    'NexusVault Original #' || lpad((existing_count + gs)::text, 3, '0'),
    'nv-catalog-' || lpad((existing_count + gs)::text, 4, '0'),
    'Premium PC catalog title with key art.',
    'Auto generated catalog entry for testing.',
    'https://picsum.photos/seed/nv-cov-' || (existing_count + gs)::text || '/600/900',
    'https://picsum.photos/seed/nv-ban-' || (existing_count + gs)::text || '/1920/1080',

    -- screenshots (jsonb)
    jsonb_build_array(
      'https://picsum.photos/seed/x1-' || (existing_count + gs)::text,
      'https://picsum.photos/seed/x2-' || (existing_count + gs)::text,
      'https://picsum.photos/seed/x3-' || (existing_count + gs)::text,
      'https://picsum.photos/seed/x4-' || (existing_count + gs)::text,
      'https://picsum.photos/seed/x5-' || (existing_count + gs)::text,
      'https://picsum.photos/seed/x6-' || (existing_count + gs)::text
    ),

    -- trailer (single)
    'https://youtube.com/watch?v=YE7VzlLtp-4',

    -- videos (JSONB FIXED)
    jsonb_build_array(
      'https://youtube.com/watch?v=YE7VzlLtp-4',
      'https://youtube.com/watch?v=OPf0YbXqDm0',
      'https://youtube.com/watch?v=WhWc3lidSK8'
    ),

    ARRAY['Action','RPG','Indie'],
    ARRAY['Singleplayer','Multiplayer'],
    'Studio X',
    'Publisher Y',
    CURRENT_DATE,
    ARRAY['Windows'],
    9.99,
    0,
    4.5,
    100,
    'https://example.com/download',
    true,
    '{}'::jsonb

  FROM generate_series(1, to_add) gs
  ON CONFLICT (slug) DO NOTHING;

  -- screenshots fix
  UPDATE public.games
  SET screenshots =
    CASE
      WHEN screenshots IS NULL OR jsonb_array_length(screenshots) >= 6 THEN screenshots
      ELSE jsonb_build_array(
        'https://picsum.photos/seed/a1/1280/720',
        'https://picsum.photos/seed/a2/1280/720',
        'https://picsum.photos/seed/a3/1280/720',
        'https://picsum.photos/seed/a4/1280/720',
        'https://picsum.photos/seed/a5/1280/720',
        'https://picsum.photos/seed/a6/1280/720'
      )
    END
  WHERE screenshots IS NULL OR jsonb_array_length(screenshots) < 6;

  -- videos fix (IMPORTANT JSONB SAFE)
  UPDATE public.games
  SET videos =
    CASE
      WHEN videos IS NULL OR jsonb_array_length(videos) >= 2 THEN videos
      ELSE jsonb_build_array(
        'https://youtube.com/watch?v=YE7VzlLtp-4',
        'https://youtube.com/watch?v=OPf0YbXqDm0'
      )
    END
  WHERE videos IS NULL OR jsonb_array_length(videos) < 2;

END $$;