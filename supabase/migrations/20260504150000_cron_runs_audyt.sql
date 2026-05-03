-- Audyt wywołań endpointów cron / maintenance (zapis z API przez service role).

CREATE TABLE IF NOT EXISTS public.cron_runs (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  affected_rows JSONB,
  error_message TEXT,
  source_ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_endpoint_started ON public.cron_runs (endpoint, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_runs_status ON public.cron_runs (status) WHERE status = 'error';

ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cron_runs_admin_only ON public.cron_runs;
CREATE POLICY cron_runs_admin_only ON public.cron_runs
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

COMMENT ON TABLE public.cron_runs IS 'Rejestr uruchomień crona (INSERT z route API z kluczem service role; odczyt tylko dla admina platformy).';
