-- GUS BDL: kanały cen (skup/targ), ludność gminy, PSR 2020, ceny gruntów woj.

ALTER TABLE public.agri_ceny_gus
  ADD COLUMN IF NOT EXISTS gus_channel text NOT NULL DEFAULT 'skup';

ALTER TABLE public.agri_ceny_gus
  DROP CONSTRAINT IF EXISTS agri_ceny_gus_powiat_teryt_kod_product_key_year_month_key;

ALTER TABLE public.agri_ceny_gus
  DROP CONSTRAINT IF EXISTS agri_ceny_gus_uniq;

ALTER TABLE public.agri_ceny_gus
  DROP CONSTRAINT IF EXISTS agri_ceny_gus_channel_check;

ALTER TABLE public.agri_ceny_gus
  ADD CONSTRAINT agri_ceny_gus_channel_check
  CHECK (gus_channel IN ('skup', 'targ'));

ALTER TABLE public.agri_ceny_gus
  ADD CONSTRAINT agri_ceny_gus_uniq
  UNIQUE (powiat_teryt_kod, product_key, year, month, gus_channel);

CREATE INDEX IF NOT EXISTS idx_agri_ceny_gus_kanal
  ON public.agri_ceny_gus (powiat_teryt_kod, gus_channel, year DESC, month DESC);

COMMENT ON COLUMN public.agri_ceny_gus.gus_channel IS
  'skup = P2967 (ceny skupu), targ = P2968 (ceny na targowiskach).';

ALTER TABLE public.villages
  ADD COLUMN IF NOT EXISTS gmina_population integer,
  ADD COLUMN IF NOT EXISTS gmina_population_rok integer,
  ADD COLUMN IF NOT EXISTS gmina_population_zrodlo text;

COMMENT ON COLUMN public.villages.gmina_population IS
  'Ludność gminy (P2462, rok) — wspólna dla wsi w tej samej gminie; nie zastępuje liczby mieszkańców wsi.';
COMMENT ON COLUMN public.villages.gmina_population_zrodlo IS
  'Opis okresu GUS, np. „rok 2024”.';

CREATE TABLE IF NOT EXISTS public.gus_psr_gmina (
  gmina_teryt_kod text PRIMARY KEY,
  rok integer NOT NULL DEFAULT 2020,
  liczba_gospodarstw integer,
  powierzchnia_ha numeric,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gus_psr_gmina IS
  'PSR 2020 (G637): liczba gospodarstw i łączna pow. UR w gminie (BDL poziom 6).';

CREATE TABLE IF NOT EXISTS public.gus_ceny_gruntow_woj (
  wojewodztwo text NOT NULL,
  woj_bdl_id text,
  rok integer NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL DEFAULT 'zł/ha',
  gus_var_id integer,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (wojewodztwo, rok)
);

COMMENT ON TABLE public.gus_ceny_gruntow_woj IS
  'P3415: średnia cena użytków rolnych za 1 ha (województwo, rok).';

ALTER TABLE public.gus_psr_gmina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gus_ceny_gruntow_woj ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gus psr gmina" ON public.gus_psr_gmina;
CREATE POLICY "Public read gus psr gmina"
ON public.gus_psr_gmina FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public read gus ceny gruntow" ON public.gus_ceny_gruntow_woj;
CREATE POLICY "Public read gus ceny gruntow"
ON public.gus_ceny_gruntow_woj FOR SELECT
USING (true);
