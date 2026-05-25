-- Runtime schema repair for NexusVault production.
-- Safe to run multiple times in Supabase SQL Editor.
-- Supabase remains the Postgres/Auth backend; game files are stored in Cloudflare R2.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticator;

-- Games need these fields for the admin UI and download API.
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS download_url text,
  ADD COLUMN IF NOT EXISTS download_path text,
  ADD COLUMN IF NOT EXISTS download_type text,
  ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.games
  DROP CONSTRAINT IF EXISTS games_download_type_check,
  ADD CONSTRAINT games_download_type_check
  CHECK (download_type IS NULL OR download_type IN ('r2', 'drive', 'external'));

COMMENT ON COLUMN public.games.download_path IS
  'Cloudflare R2 object key, for example game-slug/installer.zip. Do not store public installer URLs here.';

COMMENT ON COLUMN public.games.download_url IS
  'Optional external URL for drive/external download_type only. R2 downloads should use download_path.';

-- Orders and payments columns used by checkout/webhooks.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_price numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

UPDATE public.orders
SET
  total_price = CASE WHEN COALESCE(total_price, 0) = 0 THEN COALESCE(total, 0) ELSE total_price END,
  payment_status = CASE WHEN status = 'completed' THEN 'paid' ELSE COALESCE(payment_status, 'pending') END;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check,
  ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid'));

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS price numeric(10,2),
  ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.games(id) ON DELETE SET NULL;

UPDATE public.order_items
SET price = COALESCE(price, price_at_purchase, 0);

ALTER TABLE public.order_items
  ALTER COLUMN price SET DEFAULT 0,
  ALTER COLUMN price SET NOT NULL;

-- Webhook fulfillment upserts transactions by (order_id, type).
DELETE FROM public.transactions t
USING public.transactions duplicate
WHERE t.order_id = duplicate.order_id
  AND t.type = duplicate.type
  AND t.ctid > duplicate.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_order_type
  ON public.transactions(order_id, type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON public.orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id
  ON public.payments(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_game_completed
  ON public.orders(user_id, game_id)
  WHERE status = 'completed' AND game_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_game_order
  ON public.order_items(game_id, order_id)
  WHERE game_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_games_download_path
  ON public.games(download_path)
  WHERE download_path IS NOT NULL;

-- Library is the single source of ownership in the app.
CREATE TABLE IF NOT EXISTS public.library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.library
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS game_id uuid,
  ADD COLUMN IF NOT EXISTS acquired_at timestamptz NOT NULL DEFAULT now();

UPDATE public.library SET id = gen_random_uuid() WHERE id IS NULL;

DELETE FROM public.library
WHERE user_id IS NULL
   OR game_id IS NULL;

DELETE FROM public.library l
USING public.library duplicate
WHERE l.user_id = duplicate.user_id
  AND l.game_id = duplicate.game_id
  AND l.ctid > duplicate.ctid;

ALTER TABLE public.library
  DROP CONSTRAINT IF EXISTS library_user_id_fkey,
  ADD CONSTRAINT library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS library_game_id_fkey,
  ADD CONSTRAINT library_game_id_fkey
    FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE,
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
    ALTER TABLE public.library ADD CONSTRAINT library_pkey PRIMARY KEY (id);
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
