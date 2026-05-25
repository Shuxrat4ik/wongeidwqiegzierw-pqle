-- Adds per-game videos to satisfy: "Every game page must contain 2–3 videos".
-- Uses jsonb array of strings for flexibility with PostgREST.

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Helpful index for future querying (optional, but harmless)
CREATE INDEX IF NOT EXISTS idx_games_videos_gin
  ON public.games
  USING GIN (videos);
