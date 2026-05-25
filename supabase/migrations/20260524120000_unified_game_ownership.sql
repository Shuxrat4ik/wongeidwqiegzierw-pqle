-- Unified ownership support for paid and free games.
-- Paid access can be checked directly from orders.game_id when a checkout
-- contains one paid game, with order_items kept for multi-item compatibility.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.games(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_game_completed
  ON public.orders(user_id, game_id)
  WHERE status = 'completed' AND game_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_game_order
  ON public.order_items(game_id, order_id)
  WHERE game_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON public.orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id
  ON public.payments(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_library_user_game
  ON public.library(user_id, game_id);

DROP VIEW IF EXISTS public.user_game_ownership;
CREATE VIEW public.user_game_ownership AS
  SELECT
    l.user_id,
    l.game_id,
    l.acquired_at,
    'library'::text AS source
  FROM public.library l

  UNION

  SELECT
    o.user_id,
    o.game_id,
    o.created_at AS acquired_at,
    'order'::text AS source
  FROM public.orders o
  WHERE o.status = 'completed'
    AND o.game_id IS NOT NULL

  UNION

  SELECT
    o.user_id,
    oi.game_id,
    o.created_at AS acquired_at,
    'order_item'::text AS source
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE o.status = 'completed'
    AND oi.game_id IS NOT NULL;
