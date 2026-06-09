-- Bogatszy profil miejsca na mapie: historia, ciekawostki, galeria zdjęć, powiązanie z kroniką wsi

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS story_text TEXT,
  ADD COLUMN IF NOT EXISTS facts_text TEXT,
  ADD COLUMN IF NOT EXISTS gallery_photos JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.pois.story_text IS 'Historia miejsca — opowieść sołtysa / mieszkańców (widoczna na /mapa/miejsce/…).';
COMMENT ON COLUMN public.pois.facts_text IS 'Ciekawostki o miejscu (np. data budowy, ciekawe fakty).';
COMMENT ON COLUMN public.pois.gallery_photos IS 'Galeria zdjęć [{id, url, etykieta}] — max 12, oprócz photo_url (okładka).';

ALTER TABLE public.village_history_entries
  ADD COLUMN IF NOT EXISTS linked_poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.village_history_entries.linked_poi_id IS 'Wpis kroniki powiązany z pinezką POI (np. historia kościoła).';

CREATE INDEX IF NOT EXISTS idx_history_entries_linked_poi
  ON public.village_history_entries(linked_poi_id)
  WHERE linked_poi_id IS NOT NULL;
