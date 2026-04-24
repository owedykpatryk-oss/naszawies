-- Wyszukiwarka katalogu: wiele pól + lepsze sortowanie dopasowania.
-- Rozszerzenie mapy: teryt_id w wyniku RPC mapa_wsi_znaczniki.

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

CREATE OR REPLACE FUNCTION public.szukaj_wsi_katalog(p_fraza text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  voivodeship text,
  county text,
  commune text,
  commune_type text,
  teryt_id text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH f AS (
    SELECT btrim(p_fraza) AS t
  )
  SELECT
    v.id,
    v.name,
    v.slug,
    v.voivodeship,
    v.county,
    v.commune,
    v.commune_type,
    v.teryt_id
  FROM public.villages v, f
  WHERE length(f.t) >= 2
    AND (
      v.name ILIKE '%' || f.t || '%'
      OR v.commune ILIKE '%' || f.t || '%'
      OR v.county ILIKE '%' || f.t || '%'
      OR v.voivodeship ILIKE '%' || f.t || '%'
      OR v.teryt_id ILIKE '%' || f.t || '%'
      OR v.slug ILIKE '%' || f.t || '%'
    )
  ORDER BY
    (lower(v.name) = lower(f.t)) DESC,
    (lower(v.name) LIKE lower(f.t) || '%') DESC,
    v.name ASC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION public.szukaj_wsi_katalog(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.szukaj_wsi_katalog(text) TO anon, authenticated;

COMMENT ON FUNCTION public.szukaj_wsi_katalog(text) IS
  'Katalog wsi: fraza w nazwie, gminie, powiecie, województwie, kodzie TERYT lub slug.';
