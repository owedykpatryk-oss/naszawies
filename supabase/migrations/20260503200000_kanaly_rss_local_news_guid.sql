-- Kanały RSS/BIP → wiadomości lokalne (status pending) + deduplikacja po hash GUID/linku

ALTER TABLE public.local_news_items
  ADD COLUMN IF NOT EXISTS external_guid_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_news_village_external_guid
  ON public.local_news_items (village_id, external_guid_hash)
  WHERE external_guid_hash IS NOT NULL;

COMMENT ON COLUMN public.local_news_items.external_guid_hash IS
  'Hash stabilny wpisu z kanału RSS (deduplikacja).';

CREATE TABLE IF NOT EXISTS public.village_news_feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_news_feed_url_len CHECK (char_length(feed_url) <= 2048),
  CONSTRAINT village_news_feed_label_len CHECK (char_length(label) <= 160)
);

CREATE INDEX IF NOT EXISTS idx_village_news_feeds_village ON public.village_news_feed_sources(village_id);

DROP TRIGGER IF EXISTS update_village_news_feed_sources_updated_at ON public.village_news_feed_sources;
CREATE TRIGGER update_village_news_feed_sources_updated_at
BEFORE UPDATE ON public.village_news_feed_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_news_feed_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Soltys reads village news feeds" ON public.village_news_feed_sources;
CREATE POLICY "Soltys reads village news feeds"
ON public.village_news_feed_sources
FOR SELECT
USING (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Soltys manages village news feeds" ON public.village_news_feed_sources;
CREATE POLICY "Soltys manages village news feeds"
ON public.village_news_feed_sources
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));
