-- P2462: ludność gminy — tabela pośrednia + hurtowa propagacja na villages.

CREATE TABLE IF NOT EXISTS public.gus_ludnosc_gmina (
  gmina_teryt_kod text PRIMARY KEY,
  rok integer NOT NULL,
  ludnosc integer NOT NULL,
  zrodlo text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gus_ludnosc_gmina IS
  'P2462: ludność gminy (rok). Propagowana na villages.gmina_population.';

ALTER TABLE public.gus_ludnosc_gmina ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gus ludnosc gmina" ON public.gus_ludnosc_gmina;
CREATE POLICY "Public read gus ludnosc gmina"
ON public.gus_ludnosc_gmina FOR SELECT
USING (true);

CREATE OR REPLACE FUNCTION public.sync_villages_from_gus_ludnosc()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH u AS (
    UPDATE public.villages v
    SET
      gmina_population = g.ludnosc,
      gmina_population_rok = g.rok,
      gmina_population_zrodlo = COALESCE(g.zrodlo, 'GUS BDL P2462')
    FROM public.gus_ludnosc_gmina g
    WHERE v.gmina_teryt_kod = g.gmina_teryt_kod
    RETURNING v.id
  )
  SELECT count(*)::bigint FROM u;
$$;
