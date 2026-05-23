-- Production game store core: private downloads, Stripe payment status,
-- purchase entitlements, and RLS for user-owned commerce data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Private storage bucket for installers/builds. Files are never public; the app
-- creates short-lived signed URLs from a service-role route after entitlement checks.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('game-files', 'game-files', false, 2147483648)
ON CONFLICT (id) DO UPDATE SET public = false;

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS download_path text,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.games.download_path IS
  'Private object path inside Supabase Storage bucket game-files. Never store a public installer URL here.';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_price numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

UPDATE public.orders
SET
  total_price = CASE WHEN total_price = 0 THEN COALESCE(total, 0) ELSE total_price END,
  payment_status = CASE
    WHEN status = 'completed' THEN 'paid'
    ELSE payment_status
  END;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid'));

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS price numeric(10,2);

UPDATE public.order_items
SET price = COALESCE(price, price_at_purchase, 0);

ALTER TABLE public.order_items
  ALTER COLUMN price SET DEFAULT 0,
  ALTER COLUMN price SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS downloads_select_own ON public.downloads;
CREATE POLICY downloads_select_own ON public.downloads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS downloads_insert_own ON public.downloads;
CREATE POLICY downloads_insert_own ON public.downloads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS downloads_write_admin ON public.downloads;
CREATE POLICY downloads_write_admin ON public.downloads
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Reassert owner isolation for critical commerce tables. These policies are
-- idempotently dropped/recreated so this migration can repair drifted projects.
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cart_select_own ON public.cart;
CREATE POLICY cart_select_own ON public.cart
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS cart_insert_own ON public.cart;
CREATE POLICY cart_insert_own ON public.cart
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cart_update_own ON public.cart;
CREATE POLICY cart_update_own ON public.cart
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cart_delete_own ON public.cart;
CREATE POLICY cart_delete_own ON public.cart
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS orders_insert_own ON public.orders;
CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS orders_update_admin ON public.orders;
CREATE POLICY orders_update_admin ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS order_items_select_own ON public.order_items;
CREATE POLICY order_items_select_own ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

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
        SELECT 1 FROM public.games g
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

CREATE INDEX IF NOT EXISTS idx_games_download_path ON public.games(download_path) WHERE download_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_downloads_user_created ON public.downloads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_game ON public.downloads(game_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
