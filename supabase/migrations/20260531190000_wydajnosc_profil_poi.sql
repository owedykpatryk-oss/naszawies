-- Profil wsi + POI rolnicze: szybsze lookup po ścieżce URL i kategorii.

CREATE INDEX IF NOT EXISTS idx_villages_sciezka_profil
  ON public.villages (voivodeship_slug, county_slug, commune_slug, slug);

CREATE INDEX IF NOT EXISTS idx_pois_village_category
  ON public.pois (village_id, category);
