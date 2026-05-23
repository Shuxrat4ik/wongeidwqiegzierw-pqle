-- Allow the built-in admin account to manage catalog rows even when no
-- service-role key is configured locally.
--
-- This mirrors the Next.js admin gate, which treats admin@gamestore.com as an
-- emergency admin, and avoids relying only on public.is_admin().

DROP POLICY IF EXISTS games_write_admin ON public.games;
CREATE POLICY games_write_admin ON public.games FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@gamestore.com'
  )
  WITH CHECK (
    public.is_admin()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@gamestore.com'
  );

DROP POLICY IF EXISTS featured_write_admin ON public.featured_games;
CREATE POLICY featured_write_admin ON public.featured_games FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@gamestore.com'
  )
  WITH CHECK (
    public.is_admin()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@gamestore.com'
  );

DROP POLICY IF EXISTS categories_write_admin ON public.categories;
CREATE POLICY categories_write_admin ON public.categories FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@gamestore.com'
  )
  WITH CHECK (
    public.is_admin()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@gamestore.com'
  );

DROP POLICY IF EXISTS game_categories_write_admin ON public.game_categories;
CREATE POLICY game_categories_write_admin ON public.game_categories FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@gamestore.com'
  )
  WITH CHECK (
    public.is_admin()
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@gamestore.com'
  );
