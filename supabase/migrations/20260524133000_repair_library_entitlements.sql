-- Repair paid-game entitlements for Stripe webhook fulfillment.
-- The webhook inserts exactly (user_id, game_id) into public.library and relies
-- on a unique user/game conflict target for idempotent upserts.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.library
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS game_id uuid,
  ADD COLUMN IF NOT EXISTS acquired_at timestamptz NOT NULL DEFAULT now();

DO $$
DECLARE
  user_id_type text;
  game_id_type text;
BEGIN
  SELECT data_type INTO user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'library'
    AND column_name = 'user_id';

  SELECT data_type INTO game_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'library'
    AND column_name = 'game_id';

  IF user_id_type <> 'uuid' OR game_id_type <> 'uuid' THEN
    RAISE EXCEPTION 'public.library schema mismatch: expected user_id uuid and game_id uuid, got user_id %, game_id %',
      user_id_type, game_id_type;
  END IF;
END $$;

UPDATE public.library
SET id = gen_random_uuid()
WHERE id IS NULL;

DELETE FROM public.library
WHERE user_id IS NULL
   OR game_id IS NULL;

DELETE FROM public.library l
USING public.library duplicate
WHERE l.user_id = duplicate.user_id
  AND l.game_id = duplicate.game_id
  AND l.ctid > duplicate.ctid;

ALTER TABLE public.library
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN game_id SET NOT NULL,
  ALTER COLUMN acquired_at SET DEFAULT now(),
  ALTER COLUMN acquired_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.library'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.library
      ADD CONSTRAINT library_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.library'::regclass
      AND conname = 'library_user_id_fkey'
  ) THEN
    ALTER TABLE public.library
      ADD CONSTRAINT library_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.library'::regclass
      AND conname = 'library_game_id_fkey'
  ) THEN
    ALTER TABLE public.library
      ADD CONSTRAINT library_game_id_fkey
      FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_library_user_game
  ON public.library(user_id, game_id);

CREATE INDEX IF NOT EXISTS idx_library_user
  ON public.library(user_id);

ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS library_select_own ON public.library;
CREATE POLICY library_select_own ON public.library
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS library_insert_own ON public.library;
DROP POLICY IF EXISTS library_update_own ON public.library;
DROP POLICY IF EXISTS library_delete_own ON public.library;
DROP POLICY IF EXISTS library_insert_admin ON public.library;
DROP POLICY IF EXISTS library_insert_free_or_admin ON public.library;
CREATE POLICY library_insert_free_or_admin ON public.library
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.games g
        WHERE g.id = game_id
          AND g.price = 0
          AND g.is_available = true
      )
    )
  );

DROP POLICY IF EXISTS library_delete_admin ON public.library;
CREATE POLICY library_delete_admin ON public.library
  FOR DELETE TO authenticated
  USING (public.is_admin());
