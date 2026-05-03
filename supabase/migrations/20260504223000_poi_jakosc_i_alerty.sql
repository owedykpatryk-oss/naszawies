-- Jakość i źródło danych POI + alerty spadku jakości danych mapowych.

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'osm_auto', 'osm_manual', 'geoportal', 'local_corrected')),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.70
    CHECK (confidence >= 0 AND confidence <= 1),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_local_override BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_pois_source ON public.pois(source);
CREATE INDEX IF NOT EXISTS idx_pois_local_override ON public.pois(village_id, category, is_local_override);

CREATE TABLE IF NOT EXISTS public.geo_data_quality_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  alert_code TEXT NOT NULL CHECK (alert_code IN ('no_addresses', 'no_poi')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_data_quality_alerts_unique_state
  ON public.geo_data_quality_alerts(village_id, alert_code, status);

CREATE INDEX IF NOT EXISTS idx_geo_data_quality_alerts_village
  ON public.geo_data_quality_alerts(village_id, status, created_at DESC);

DROP TRIGGER IF EXISTS update_geo_data_quality_alerts_updated_at ON public.geo_data_quality_alerts;
CREATE TRIGGER update_geo_data_quality_alerts_updated_at
BEFORE UPDATE ON public.geo_data_quality_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.geo_data_quality_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Soltys reads village geo data quality alerts" ON public.geo_data_quality_alerts;
CREATE POLICY "Soltys reads village geo data quality alerts"
ON public.geo_data_quality_alerts
FOR SELECT
USING (public.is_village_soltys(village_id) OR public.is_platform_admin());
