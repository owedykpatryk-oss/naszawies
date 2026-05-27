-- Kod TERC gminy (7 znaków) — do pobierania granic A05; teryt_id w villages to SIMC miejscowości.

ALTER TABLE public.villages
  ADD COLUMN IF NOT EXISTS gmina_teryt_kod text;

CREATE INDEX IF NOT EXISTS idx_villages_gmina_teryt_kod
  ON public.villages (gmina_teryt_kod)
  WHERE gmina_teryt_kod IS NOT NULL;

COMMENT ON COLUMN public.villages.gmina_teryt_kod IS
  '7-znakowy kod TERC gminy (WOJ+POW+GM+RODZ). Używany przy sync granic PRG warstwa A05.';

DROP FUNCTION IF EXISTS public.villages_kolejka_sync_granic_prg(integer);

CREATE OR REPLACE FUNCTION public.villages_kolejka_sync_granic_prg(p_limit integer)
RETURNS TABLE (
  id uuid,
  name text,
  teryt_id text,
  gmina_teryt_kod text,
  boundary_geojson jsonb,
  latitude numeric,
  longitude numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH mieszkancy_lub_panel AS (
    SELECT DISTINCT uvr.village_id
    FROM public.user_village_roles uvr
    WHERE uvr.status = 'active'
      AND uvr.role IN (
        'mieszkaniec',
        'soltys',
        'wspoladmin',
        'reprezentant_podmiotu',
        'kgw_przewodniczaca',
        'osp_naczelnik',
        'rada_solecka'
      )
  )
  SELECT
    v.id,
    v.name,
    v.teryt_id,
    v.gmina_teryt_kod,
    v.boundary_geojson,
    v.latitude,
    v.longitude
  FROM public.villages v
  WHERE v.is_active = true
    AND v.teryt_id IS NOT NULL
    AND btrim(v.teryt_id) <> ''
    AND (
      v.boundary_geojson IS NULL
      OR v.boundary_source IS NULL
      OR v.boundary_source = 'demo'
    )
  ORDER BY
    CASE WHEN v.boundary_geojson IS NULL THEN 0 ELSE 1 END,
    CASE WHEN v.latitude IS NOT NULL AND v.longitude IS NOT NULL THEN 0 ELSE 1 END,
    CASE
      WHEN v.soltys_user_id IS NOT NULL THEN 0
      WHEN EXISTS (SELECT 1 FROM mieszkancy_lub_panel m WHERE m.village_id = v.id) THEN 1
      ELSE 2
    END,
    v.updated_at ASC NULLS FIRST
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 500));
$$;
