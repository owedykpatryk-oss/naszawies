-- Mapa: kody TERC gminy/powiatu w RPC znaczników (oficjalne obrysy administracyjne).

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

COMMENT ON FUNCTION public.mapa_wsi_znaczniki() IS
  'Znaczniki mapy wsi: współrzędne, obrys PRG, kody TERC gminy/powiatu, licznik ofert targu.';
