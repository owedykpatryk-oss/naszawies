-- Geoportal / PRG: punkty adresowe + stan automatycznego synchronizowania granic.

CREATE TABLE IF NOT EXISTS public.address_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  teryt_simc TEXT,
  teryt_ulic TEXT,
  street_name TEXT,
  house_number TEXT NOT NULL,
  postal_code TEXT,
  source_name TEXT NOT NULL DEFAULT 'PRG',
  source_external_id TEXT,
  location_geom JSONB,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_address_points_village_id ON public.address_points(village_id);
CREATE INDEX IF NOT EXISTS idx_address_points_source ON public.address_points(source_name);
CREATE INDEX IF NOT EXISTS idx_address_points_geo ON public.address_points(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_address_points_teryt ON public.address_points(teryt_simc, teryt_ulic);

-- Unikalność łagodna: ten sam punkt źródłowy nie powinien tworzyć duplikatów.
CREATE UNIQUE INDEX IF NOT EXISTS idx_address_points_unique_source
  ON public.address_points(village_id, source_name, source_external_id)
  WHERE source_external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.geoportal_boundary_sync_state (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  last_boundary_sync_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('success', 'error')),
  last_error_message TEXT,
  last_source_name TEXT,
  last_source_type_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geoportal_boundary_sync_state_status
  ON public.geoportal_boundary_sync_state(last_status, last_boundary_sync_at DESC);

CREATE TABLE IF NOT EXISTS public.geoportal_address_sync_state (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  last_address_sync_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('success', 'error')),
  last_error_message TEXT,
  last_source_name TEXT,
  last_source_type_name TEXT,
  last_synced_points_count INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geoportal_address_sync_state_status
  ON public.geoportal_address_sync_state(last_status, last_address_sync_at DESC);

CREATE TABLE IF NOT EXISTS public.geo_context_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  dataset TEXT NOT NULL,
  layer_name TEXT NOT NULL,
  feature_category TEXT,
  feature_name TEXT,
  source_external_id TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  geometry JSONB,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_context_features_village_id ON public.geo_context_features(village_id);
CREATE INDEX IF NOT EXISTS idx_geo_context_features_dataset ON public.geo_context_features(dataset, layer_name);
CREATE INDEX IF NOT EXISTS idx_geo_context_features_geo ON public.geo_context_features(latitude, longitude);

CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_context_features_unique_source
  ON public.geo_context_features(village_id, dataset, layer_name, source_external_id)
  WHERE source_external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.geoportal_prng_sync_state (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('success', 'error')),
  last_error_message TEXT,
  last_source_name TEXT,
  last_source_type_name TEXT,
  last_synced_features_count INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.geoportal_institutional_sync_state (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('success', 'error')),
  last_error_message TEXT,
  last_source_name TEXT,
  last_source_type_name TEXT,
  last_synced_features_count INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.address_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geoportal_boundary_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geoportal_address_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_context_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geoportal_prng_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geoportal_institutional_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS address_points_public_select ON public.address_points;
CREATE POLICY address_points_public_select
ON public.address_points FOR SELECT
USING (true);

DROP POLICY IF EXISTS address_points_soltys_manage ON public.address_points;
CREATE POLICY address_points_soltys_manage
ON public.address_points FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS geoportal_boundary_sync_state_admin_select ON public.geoportal_boundary_sync_state;
CREATE POLICY geoportal_boundary_sync_state_admin_select
ON public.geoportal_boundary_sync_state FOR SELECT
TO authenticated
USING (public.is_platform_admin());

DROP POLICY IF EXISTS geoportal_address_sync_state_admin_select ON public.geoportal_address_sync_state;
CREATE POLICY geoportal_address_sync_state_admin_select
ON public.geoportal_address_sync_state FOR SELECT
TO authenticated
USING (public.is_platform_admin());

DROP POLICY IF EXISTS geo_context_features_public_select ON public.geo_context_features;
CREATE POLICY geo_context_features_public_select
ON public.geo_context_features FOR SELECT
USING (true);

DROP POLICY IF EXISTS geoportal_prng_sync_state_admin_select ON public.geoportal_prng_sync_state;
CREATE POLICY geoportal_prng_sync_state_admin_select
ON public.geoportal_prng_sync_state FOR SELECT
TO authenticated
USING (public.is_platform_admin());

DROP POLICY IF EXISTS geoportal_institutional_sync_state_admin_select ON public.geoportal_institutional_sync_state;
CREATE POLICY geoportal_institutional_sync_state_admin_select
ON public.geoportal_institutional_sync_state FOR SELECT
TO authenticated
USING (public.is_platform_admin());

COMMENT ON TABLE public.address_points IS
  'Punkty adresowe przypisane do wsi (źródło PRG/Geoportal lub ręczne), używane do mapy i wyszukiwania.';

COMMENT ON TABLE public.geoportal_boundary_sync_state IS
  'Stan automatycznej synchronizacji granic wsi z usług PRG WFS (ostatni status, błąd, data).';

COMMENT ON TABLE public.geoportal_address_sync_state IS
  'Stan automatycznej synchronizacji punktów adresowych i ulic z usług KIN/PRG WFS.';

COMMENT ON TABLE public.geo_context_features IS
  'Obiekty kontekstowe z Geoportalu (PRNG, warstwy instytucjonalne PRG) dla widoku mapy i profilu wsi.';

COMMENT ON TABLE public.geoportal_prng_sync_state IS
  'Stan automatycznej synchronizacji obiektów PRNG (nazwy geograficzne) dla wsi.';

COMMENT ON TABLE public.geoportal_institutional_sync_state IS
  'Stan automatycznej synchronizacji warstw instytucjonalnych PRG (PSP/policja itd.).';
