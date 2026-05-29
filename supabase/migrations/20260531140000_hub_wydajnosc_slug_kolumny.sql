-- Wydajność hubów administracyjnych: slugi jako kolumny STORED + indeksy.
-- Eliminuje pełny skan villages przy slug_pl(voivodeship/county/commune) w WHERE.

ALTER TABLE public.villages
  ADD COLUMN IF NOT EXISTS voivodeship_slug text
    GENERATED ALWAYS AS (public.slug_pl(voivodeship)) STORED,
  ADD COLUMN IF NOT EXISTS county_slug text
    GENERATED ALWAYS AS (public.slug_pl(county)) STORED,
  ADD COLUMN IF NOT EXISTS commune_slug text
    GENERATED ALWAYS AS (public.slug_pl(commune)) STORED;

CREATE INDEX IF NOT EXISTS idx_villages_voivodeship_slug
  ON public.villages (voivodeship_slug);

CREATE INDEX IF NOT EXISTS idx_villages_voiv_county_slug
  ON public.villages (voivodeship_slug, county_slug);

CREATE INDEX IF NOT EXISTS idx_villages_hub_sciezka
  ON public.villages (voivodeship_slug, county_slug, commune_slug);

CREATE INDEX IF NOT EXISTS idx_villages_brak_granicy_sync
  ON public.villages (is_active DESC, updated_at ASC)
  WHERE boundary_geojson IS NULL
    AND teryt_id IS NOT NULL
    AND btrim(teryt_id) <> '';

-- Hub: jedno zapytanie zamiast 16× hub_powiaty_w_wojewodztwie na stronie katalogu
CREATE OR REPLACE FUNCTION public.hub_podsumowanie_wojewodztw()
RETURNS TABLE (
  voivodeship text,
  voivodeship_slug text,
  liczba_wsi bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    v.voivodeship,
    v.voivodeship_slug,
    count(*)::bigint AS liczba_wsi
  FROM public.villages v
  GROUP BY v.voivodeship, v.voivodeship_slug
  ORDER BY v.voivodeship ASC;
$$;

CREATE OR REPLACE FUNCTION public.hub_wsi_po_sciezce(
  p_woj_slug text,
  p_pow_slug text DEFAULT NULL,
  p_gmina_slug text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  voivodeship text,
  county text,
  commune text,
  commune_type text,
  population integer,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    v.id,
    v.name,
    v.slug,
    v.voivodeship,
    v.county,
    v.commune,
    v.commune_type,
    v.population,
    v.is_active
  FROM public.villages v
  WHERE v.voivodeship_slug = p_woj_slug
    AND (p_pow_slug IS NULL OR v.county_slug = p_pow_slug)
    AND (p_gmina_slug IS NULL OR v.commune_slug = p_gmina_slug)
  ORDER BY v.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.hub_gminy_w_powiacie(p_woj_slug text, p_pow_slug text)
RETURNS TABLE (
  commune text,
  commune_type text,
  liczba_wsi bigint,
  liczba_aktywnych bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    v.commune,
    max(v.commune_type) AS commune_type,
    count(*)::bigint AS liczba_wsi,
    count(*) FILTER (WHERE v.is_active)::bigint AS liczba_aktywnych
  FROM public.villages v
  WHERE v.voivodeship_slug = p_woj_slug
    AND v.county_slug = p_pow_slug
  GROUP BY v.commune
  ORDER BY v.commune ASC;
$$;

CREATE OR REPLACE FUNCTION public.hub_powiaty_w_wojewodztwie(p_woj_slug text)
RETURNS TABLE (
  county text,
  liczba_gmin bigint,
  liczba_wsi bigint,
  liczba_aktywnych bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    v.county,
    count(DISTINCT v.commune)::bigint AS liczba_gmin,
    count(*)::bigint AS liczba_wsi,
    count(*) FILTER (WHERE v.is_active)::bigint AS liczba_aktywnych
  FROM public.villages v
  WHERE v.voivodeship_slug = p_woj_slug
  GROUP BY v.county
  ORDER BY v.county ASC;
$$;

-- Mapa: jeden JOIN zamiast podzapytania skorelowanego per wieś
DROP FUNCTION IF EXISTS public.mapa_wsi_znaczniki();

CREATE OR REPLACE FUNCTION public.mapa_wsi_znaczniki()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  voivodeship text,
  county text,
  commune text,
  teryt_id text,
  latitude numeric,
  longitude numeric,
  population integer,
  boundary_geojson jsonb,
  public_offers_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    v.id,
    v.name,
    v.slug,
    v.voivodeship,
    v.county,
    v.commune,
    v.teryt_id,
    v.latitude,
    v.longitude,
    v.population,
    v.boundary_geojson,
    COALESCE(pc.cnt, 0::bigint) AS public_offers_count
  FROM public.villages v
  LEFT JOIN (
    SELECT p.village_id, count(*)::bigint AS cnt
    FROM public.posts p
    WHERE p.status = 'approved'::post_status
      AND p.type = 'targ_lokalny'::post_type
    GROUP BY p.village_id
  ) pc ON pc.village_id = v.id
  WHERE v.is_active = true
    AND v.latitude IS NOT NULL
    AND v.longitude IS NOT NULL
  ORDER BY v.name
  LIMIT 800;
$$;

REVOKE ALL ON FUNCTION public.mapa_wsi_znaczniki() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mapa_wsi_znaczniki() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.hub_podsumowanie_wojewodztw() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hub_podsumowanie_wojewodztw() TO anon, authenticated;
