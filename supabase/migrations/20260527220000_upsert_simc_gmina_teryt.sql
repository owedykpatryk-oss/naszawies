-- upsert_villages_simc: zapis gmina_teryt_kod (gdy migracja 20260527150000 już była na produkcji).

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
