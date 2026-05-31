-- Rozszerzenie alertów jakości mapy: niezweryfikowane POI i niska kompletność.

ALTER TABLE public.geo_data_quality_alerts
  DROP CONSTRAINT IF EXISTS geo_data_quality_alerts_alert_code_check;

ALTER TABLE public.geo_data_quality_alerts
  ADD CONSTRAINT geo_data_quality_alerts_alert_code_check
  CHECK (alert_code IN ('no_addresses', 'no_poi', 'unverified_poi', 'low_map_completeness'));
