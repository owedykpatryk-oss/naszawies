-- Przewodnik „gmina / powiat / województwo” — kontakty i notatki lokalne (uzupełnia sołtys) + ogólna treść w aplikacji

CREATE TABLE IF NOT EXISTS public.village_civic_guides (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  commune_info TEXT,
  county_info TEXT,
  voivodeship_info TEXT,
  roads_info TEXT,
  waste_info TEXT,
  utilities_info TEXT,
  other_info TEXT,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_civic_commune_len CHECK (commune_info IS NULL OR char_length(commune_info) <= 8000),
  CONSTRAINT village_civic_county_len CHECK (county_info IS NULL OR char_length(county_info) <= 8000),
  CONSTRAINT village_civic_voiv_len CHECK (voivodeship_info IS NULL OR char_length(voivodeship_info) <= 8000),
  CONSTRAINT village_civic_roads_len CHECK (roads_info IS NULL OR char_length(roads_info) <= 8000),
  CONSTRAINT village_civic_waste_len CHECK (waste_info IS NULL OR char_length(waste_info) <= 8000),
  CONSTRAINT village_civic_util_len CHECK (utilities_info IS NULL OR char_length(utilities_info) <= 8000),
  CONSTRAINT village_civic_other_len CHECK (other_info IS NULL OR char_length(other_info) <= 8000)
);

DROP TRIGGER IF EXISTS update_village_civic_guides_updated_at ON public.village_civic_guides;
CREATE TRIGGER update_village_civic_guides_updated_at
BEFORE UPDATE ON public.village_civic_guides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_civic_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public civic guide read" ON public.village_civic_guides;
CREATE POLICY "Public civic guide read"
ON public.village_civic_guides
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id = village_id
      AND (
        v.is_active = true
        OR public.is_village_resident(village_id)
        OR public.is_village_soltys(village_id)
      )
  )
);

DROP POLICY IF EXISTS "Soltys manages civic guide" ON public.village_civic_guides;
CREATE POLICY "Soltys manages civic guide"
ON public.village_civic_guides
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));
