-- Tryb importu RSS: tylko tytuły (bez duplikowania treści artykułu).

ALTER TABLE public.village_news_feed_sources
  ADD COLUMN IF NOT EXISTS import_titles_only BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.village_news_feed_sources.import_titles_only IS
  'Gdy true — import RSS zapisuje tylko tytuł i link źródła (summary/body puste).';
