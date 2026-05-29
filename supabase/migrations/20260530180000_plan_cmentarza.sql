-- Plan cmentarza: obrys OSM, układ kwater/rzędów/grobów, wyszukiwarka, wirtualne znicze.

CREATE TABLE IF NOT EXISTS public.village_cemetery_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  boundary_geojson JSONB,
  plan_data JSONB NOT NULL DEFAULT '{"wersja":1,"elementy":[]}'::jsonb,
  orthophoto_enabled BOOLEAN NOT NULL DEFAULT true,
  gate_slug TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  virtual_candles_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cemetery_plans_village ON public.village_cemetery_plans(village_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cemetery_plans_gate_slug
  ON public.village_cemetery_plans(gate_slug) WHERE gate_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cemetery_plans_poi ON public.village_cemetery_plans(poi_id);

COMMENT ON TABLE public.village_cemetery_plans IS 'Interaktywny plan cmentarza wsi — układ kwater, rzędów i grobów.';
COMMENT ON COLUMN public.village_cemetery_plans.boundary_geojson IS 'Obrys cmentarza z OSM (GeoJSON Polygon/MultiPolygon, WGS84).';
COMMENT ON COLUMN public.village_cemetery_plans.plan_data IS 'Elementy planu (kwatera, rzad, grob, sciezka, brama…) w skali 0–100×0–70.';
COMMENT ON COLUMN public.village_cemetery_plans.gate_slug IS 'Krótki slug do QR przy bramie (opcjonalnie).';

CREATE TABLE IF NOT EXISTS public.cemetery_grave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cemetery_plan_id UUID NOT NULL REFERENCES public.village_cemetery_plans(id) ON DELETE CASCADE,
  plan_element_id UUID,
  kwatera TEXT,
  rzad TEXT,
  numer_gravu TEXT,
  nazwisko TEXT NOT NULL,
  imie TEXT,
  rok_urodzenia INT CHECK (rok_urodzenia IS NULL OR (rok_urodzenia >= 1600 AND rok_urodzenia <= 2100)),
  rok_smierci INT CHECK (rok_smierci IS NULL OR (rok_smierci >= 1600 AND rok_smierci <= 2100)),
  notatka TEXT,
  photo_url TEXT,
  photo_private BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cemetery_graves_plan ON public.cemetery_grave_records(cemetery_plan_id);
CREATE INDEX IF NOT EXISTS idx_cemetery_graves_nazwisko ON public.cemetery_grave_records(cemetery_plan_id, lower(nazwisko));
CREATE INDEX IF NOT EXISTS idx_cemetery_graves_status ON public.cemetery_grave_records(cemetery_plan_id, status);

CREATE TABLE IF NOT EXISTS public.cemetery_virtual_candles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cemetery_plan_id UUID NOT NULL REFERENCES public.village_cemetery_plans(id) ON DELETE CASCADE,
  grave_record_id UUID REFERENCES public.cemetery_grave_records(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cemetery_candles_plan ON public.cemetery_virtual_candles(cemetery_plan_id, created_at DESC);

DROP TRIGGER IF EXISTS update_village_cemetery_plans_updated_at ON public.village_cemetery_plans;
CREATE TRIGGER update_village_cemetery_plans_updated_at
  BEFORE UPDATE ON public.village_cemetery_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cemetery_grave_records_updated_at ON public.cemetery_grave_records;
CREATE TRIGGER update_cemetery_grave_records_updated_at
  BEFORE UPDATE ON public.cemetery_grave_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_cemetery_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cemetery_grave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cemetery_virtual_candles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published cemetery plans" ON public.village_cemetery_plans;
CREATE POLICY "Public read published cemetery plans"
ON public.village_cemetery_plans FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Soltys manages cemetery plans" ON public.village_cemetery_plans;
CREATE POLICY "Soltys manages cemetery plans"
ON public.village_cemetery_plans FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Public read approved grave records" ON public.cemetery_grave_records;
CREATE POLICY "Public read approved grave records"
ON public.cemetery_grave_records FOR SELECT
USING (
  status = 'approved'
  AND cemetery_plan_id IN (
    SELECT id FROM public.village_cemetery_plans WHERE is_published = true
  )
);

DROP POLICY IF EXISTS "Soltys manages grave records" ON public.cemetery_grave_records;
CREATE POLICY "Soltys manages grave records"
ON public.cemetery_grave_records FOR ALL
USING (
  cemetery_plan_id IN (
    SELECT id FROM public.village_cemetery_plans WHERE public.is_village_soltys(village_id)
  )
)
WITH CHECK (
  cemetery_plan_id IN (
    SELECT id FROM public.village_cemetery_plans WHERE public.is_village_soltys(village_id)
  )
);

DROP POLICY IF EXISTS "Anyone inserts virtual candles on published plans" ON public.cemetery_virtual_candles;
CREATE POLICY "Anyone inserts virtual candles on published plans"
ON public.cemetery_virtual_candles FOR INSERT
WITH CHECK (
  cemetery_plan_id IN (
    SELECT id FROM public.village_cemetery_plans
    WHERE is_published = true AND virtual_candles_enabled = true
  )
);

DROP POLICY IF EXISTS "Public read candle counts" ON public.cemetery_virtual_candles;
CREATE POLICY "Public read candle counts"
ON public.cemetery_virtual_candles FOR SELECT
USING (
  cemetery_plan_id IN (
    SELECT id FROM public.village_cemetery_plans WHERE is_published = true
  )
);

DROP POLICY IF EXISTS "Soltys reads all candles" ON public.cemetery_virtual_candles;
CREATE POLICY "Soltys reads all candles"
ON public.cemetery_virtual_candles FOR SELECT
USING (
  cemetery_plan_id IN (
    SELECT id FROM public.village_cemetery_plans WHERE public.is_village_soltys(village_id)
  )
);
