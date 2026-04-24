-- Granice wsi (GeoJSON w JSONB) + RPC pod mapę: współrzędne + licznik publicznych ofert (targ lokalny).

ALTER TABLE public.villages
  ADD COLUMN IF NOT EXISTS boundary_geojson jsonb;

COMMENT ON COLUMN public.villages.boundary_geojson IS
  'Opcjonalny GeoJSON (Polygon lub MultiPolygon, WGS84). Brak = na mapie przybliżony okrąg wokół punktu.';

-- Demo: Studzienki — mały poligon wokół centrum (przykład importu SHP/GeoJSON później).
UPDATE public.villages
SET boundary_geojson = '{
  "type": "Polygon",
  "coordinates": [[
    [17.5538, 53.0648],
    [17.5642, 53.0648],
    [17.5642, 53.0702],
    [17.5538, 53.0702],
    [17.5538, 53.0648]
  ]]
}'::jsonb
WHERE teryt_id = '0088390';

CREATE OR REPLACE FUNCTION public.mapa_wsi_znaczniki()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  voivodeship text,
  county text,
  commune text,
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
    v.latitude,
    v.longitude,
    v.population,
    v.boundary_geojson,
    COALESCE(
      (
        SELECT count(*)::bigint
        FROM public.posts p
        WHERE p.village_id = v.id
          AND p.status = 'approved'::post_status
          AND p.type = 'targ_lokalny'::post_type
      ),
      0::bigint
    ) AS public_offers_count
  FROM public.villages v
  WHERE v.is_active = true
    AND v.latitude IS NOT NULL
    AND v.longitude IS NOT NULL
  ORDER BY v.name
  LIMIT 800;
$$;

REVOKE ALL ON FUNCTION public.mapa_wsi_znaczniki() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mapa_wsi_znaczniki() TO anon, authenticated;

COMMENT ON FUNCTION public.mapa_wsi_znaczniki() IS
  'Dane pod mapę: współrzędne, opcjonalna granica GeoJSON, liczba publicznych ofert (targ lokalny). RLS na posts stosuje się w podzapytaniu.';
