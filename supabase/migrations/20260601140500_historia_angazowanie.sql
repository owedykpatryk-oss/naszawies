-- Angażowanie przy kronice wsi: wyświetlenia, świeczki, wyróżnienie, zapis w ulubionych

ALTER TABLE public.village_history_entries
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS candle_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_history_entries_featured
  ON public.village_history_entries (village_id, is_featured)
  WHERE is_featured = true AND status = 'approved';

CREATE TABLE IF NOT EXISTS public.village_history_candles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.village_history_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entry_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_history_candles_entry ON public.village_history_candles(entry_id);

ALTER TABLE public.village_history_candles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own history candles" ON public.village_history_candles;
CREATE POLICY "Users insert own history candles"
ON public.village_history_candles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own history candles" ON public.village_history_candles;
CREATE POLICY "Users delete own history candles"
ON public.village_history_candles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read candle counts via entries" ON public.village_history_candles;
CREATE POLICY "Public read candle counts via entries"
ON public.village_history_candles FOR SELECT
TO authenticated
USING (true);

-- Ulubione: wpisy historii
ALTER TABLE public.user_saved_content
  DROP CONSTRAINT IF EXISTS user_saved_content_content_type_check;

ALTER TABLE public.user_saved_content
  ADD CONSTRAINT user_saved_content_content_type_check
  CHECK (content_type IN ('post', 'event', 'listing', 'history'));
