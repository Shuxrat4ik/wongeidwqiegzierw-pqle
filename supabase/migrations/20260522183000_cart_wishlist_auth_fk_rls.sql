-- Repair cart/wishlist ownership so authenticated inserts use auth.users
-- directly and cannot fail because a profile row is missing.

ALTER TABLE public.cart
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.wishlist
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.cart
  DROP CONSTRAINT IF EXISTS cart_user_id_fkey,
  ADD CONSTRAINT cart_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist
  DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey,
  ADD CONSTRAINT wishlist_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

DELETE FROM public.cart c
USING (
  SELECT ctid
  FROM (
    SELECT ctid, row_number() OVER (PARTITION BY user_id, game_id ORDER BY created_at DESC, id DESC) AS rn
    FROM public.cart
  ) ranked
  WHERE ranked.rn > 1
) dupes
WHERE c.ctid = dupes.ctid;

DELETE FROM public.wishlist w
USING (
  SELECT ctid
  FROM (
    SELECT ctid, row_number() OVER (PARTITION BY user_id, game_id ORDER BY created_at DESC, id DESC) AS rn
    FROM public.wishlist
  ) ranked
  WHERE ranked.rn > 1
) dupes
WHERE w.ctid = dupes.ctid;

ALTER TABLE public.cart
  DROP CONSTRAINT IF EXISTS cart_user_id_game_id_key,
  ADD CONSTRAINT cart_user_id_game_id_key UNIQUE (user_id, game_id);

ALTER TABLE public.wishlist
  DROP CONSTRAINT IF EXISTS wishlist_user_id_game_id_key,
  ADD CONSTRAINT wishlist_user_id_game_id_key UNIQUE (user_id, game_id);

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS wishlist_select_own ON public.wishlist;
CREATE POLICY wishlist_select_own ON public.wishlist
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS wishlist_insert_own ON public.wishlist;
CREATE POLICY wishlist_insert_own ON public.wishlist
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS wishlist_delete_own ON public.wishlist;
CREATE POLICY wishlist_delete_own ON public.wishlist
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_game ON public.cart(game_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_game ON public.wishlist(game_id);
