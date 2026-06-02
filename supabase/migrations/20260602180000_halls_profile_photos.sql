-- Galeria profilu budynku świetlicy (do 10 zdjęć z etykietami: sala, kuchnia, plac zabaw…)

ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS profile_photos JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.halls.profile_photos IS
  'Galeria profilu budynku: tablica {id, url, etykieta} — max 10 pozycji w aplikacji.';

DROP FUNCTION IF EXISTS public.halls_publiczne_dla_wsi(uuid);

CREATE FUNCTION public.halls_publiczne_dla_wsi(p_village_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  area_m2 numeric,
  max_capacity integer,
  parking_spaces integer,
  description text,
  cover_image_url text,
  profile_photos jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    h.id,
    h.name,
    h.address,
    h.area_m2,
    h.max_capacity,
    h.parking_spaces,
    h.description,
    h.cover_image_url,
    h.profile_photos
  FROM public.halls h
  INNER JOIN public.villages v ON v.id = h.village_id
  WHERE h.village_id = p_village_id
    AND v.is_active = true
  ORDER BY h.name ASC;
$$;

REVOKE ALL ON FUNCTION public.halls_publiczne_dla_wsi(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.halls_publiczne_dla_wsi(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.halls_publiczne_dla_wsi(uuid) IS
  'Bezpieczne pola sali dla profilu publicznego wsi — bez wyposażenia i danych wewnętrznych.';
