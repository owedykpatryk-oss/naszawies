-- Mapa katalogu: lekki RPC bez boundary_geojson (lazy load przez /api/mapa/granice-wsi).
-- Poprzednia wersja zwracała ~160 MB GeoJSON i przekraczała statement_timeout.

CREATE INDEX IF NOT EXISTS idx_villages_mapa_katalog
  ON public.villages (is_active DESC, name)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_targ_lokalny_approved
  ON public.posts (village_id)
  WHERE status = 'approved'::post_status AND type = 'targ_lokalny'::post_type;

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
  gmina_teryt_kod text,
  powiat_teryt_kod text,
  latitude numeric,
  longitude numeric,
  population integer,
  boundary_geojson jsonb,
  has_boundary boolean,
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
    v.gmina_teryt_kod,
    v.powiat_teryt_kod,
    v.latitude,
    v.longitude,
    v.population,
    NULL::jsonb AS boundary_geojson,
    (v.boundary_geojson IS NOT NULL) AS has_boundary,
    COALESCE(pc.cnt, 0::bigint) AS public_offers_count
  FROM public.villages v
  LEFT JOIN (
    SELECT p.village_id, count(*)::bigint AS cnt
    FROM public.posts p
    WHERE p.status = 'approved'::post_status
      AND p.type = 'targ_lokalny'::post_type
    GROUP BY p.village_id
  ) pc ON pc.village_id = v.id
  WHERE v.latitude IS NOT NULL
    AND v.longitude IS NOT NULL
    AND (v.is_active = true OR v.boundary_geojson IS NOT NULL)
  ORDER BY v.is_active DESC, v.name
  LIMIT 3000;
$$;

REVOKE ALL ON FUNCTION public.mapa_wsi_znaczniki() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mapa_wsi_znaczniki() TO anon, authenticated;

COMMENT ON FUNCTION public.mapa_wsi_znaczniki() IS
  'Znaczniki mapy (bez GeoJSON — obrysy lazy load). Aktywne wsi + katalog z obrysem PRG.';
