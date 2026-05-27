-- Import SIMC + metadane granic (sync z PRG)

ALTER TABLE public.villages
  ADD COLUMN IF NOT EXISTS boundary_source text,
  ADD COLUMN IF NOT EXISTS boundary_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS gmina_teryt_kod text;

COMMENT ON COLUMN public.villages.boundary_source IS
  'Źródło obrysu: prg_a05, prg_a06, prg_a05_bbox, prg_a06_bbox, manual, demo (legacy). NULL = brak / nieznane.';

UPDATE public.villages
SET
  boundary_geojson = NULL,
  boundary_source = NULL,
  boundary_synced_at = NULL
WHERE teryt_id = '0088390'
  AND boundary_geojson IS NOT NULL
  AND boundary_geojson::text LIKE '%17.5538%';

CREATE OR REPLACE FUNCTION public.upsert_villages_simc(p_rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RETURN 0;
  END IF;

  INSERT INTO public.villages (
    teryt_id, gmina_teryt_kod, name, slug, voivodeship, county, commune, commune_type, is_active
  )
  SELECT
    r.teryt_id,
    r.gmina_teryt_kod,
    r.name,
    r.slug,
    r.voivodeship,
    r.county,
    r.commune,
    r.commune_type,
    COALESCE(r.is_active, false)
  FROM jsonb_to_recordset(p_rows) AS r(
    teryt_id text,
    gmina_teryt_kod text,
    name text,
    slug text,
    voivodeship text,
    county text,
    commune text,
    commune_type text,
    is_active boolean
  )
  ON CONFLICT (teryt_id) DO UPDATE SET
    gmina_teryt_kod = COALESCE(EXCLUDED.gmina_teryt_kod, villages.gmina_teryt_kod),
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    voivodeship = EXCLUDED.voivodeship,
    county = EXCLUDED.county,
    commune = EXCLUDED.commune,
    commune_type = EXCLUDED.commune_type,
    updated_at = NOW()
  WHERE
    villages.is_active = false
    AND villages.soltys_user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.ustaw_granice_wsi(
  p_teryt_id text,
  p_boundary jsonb,
  p_source text,
  p_lat numeric DEFAULT NULL,
  p_lon numeric DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.villages v
  SET
    boundary_geojson = p_boundary,
    boundary_source = p_source,
    boundary_synced_at = NOW(),
    latitude = COALESCE(p_lat, v.latitude),
    longitude = COALESCE(p_lon, v.longitude),
    updated_at = NOW()
  WHERE v.teryt_id = p_teryt_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_villages_simc(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ustaw_granice_wsi(text, jsonb, text, numeric, numeric) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upsert_villages_simc(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.ustaw_granice_wsi(text, jsonb, text, numeric, numeric) TO service_role;
