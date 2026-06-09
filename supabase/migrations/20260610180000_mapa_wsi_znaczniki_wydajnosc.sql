-- Mapa: szybszy RPC (bez odczytu TOAST boundary_geojson, SECURITY DEFINER, paginacja).

DROP FUNCTION IF EXISTS public.mapa_wsi_znaczniki();
DROP FUNCTION IF EXISTS public.mapa_wsi_znaczniki(integer, integer);

CREATE OR REPLACE FUNCTION public.mapa_wsi_znaczniki(
  p_limit integer DEFAULT 1000,
  p_offset integer DEFAULT 0
)
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
SECURITY DEFINER
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
    (
      v.boundary_source IS NOT NULL
      AND v.boundary_source NOT LIKE '%\_gmina'
    ) AS has_boundary,
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
    AND (v.is_active = true OR v.boundary_source IS NOT NULL)
  ORDER BY v.is_active DESC, v.name
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 1000), 1000))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

CREATE INDEX IF NOT EXISTS idx_villages_mapa_katalog_zrodlo
  ON public.villages (is_active DESC, name)
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND (is_active = true OR boundary_source IS NOT NULL);

REVOKE ALL ON FUNCTION public.mapa_wsi_znaczniki(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mapa_wsi_znaczniki(integer, integer) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.mapa_wsi_znaczniki(integer, integer) IS
  'Znaczniki mapy (bez GeoJSON, max 1000/strona). Obrysy: /api/mapa/granice-wsi.';
