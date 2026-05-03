-- Idempotencja równoległych cronów: advisory lock dla run_village_automation (jedna sesja DB),
-- lease w tabeli dla długiego jobu RSS (wielokrokowy kod TS na jednym połączeniu z puli).

-- --- A) Automatyzacja wsi: jedna funkcja = lock + praca + unlock -----------------

CREATE OR REPLACE FUNCTION public.run_village_automation_for_cron()
RETURNS TABLE(action TEXT, affected_rows BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_key integer := hashtext('naszawies:cron:run_village_automation');
  r RECORD;
BEGIN
  IF NOT pg_try_advisory_lock(v_lock_key) THEN
    action := 'skipped_concurrent_lock';
    affected_rows := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  BEGIN
    FOR r IN SELECT * FROM public.run_village_automation() LOOP
      action := r.action;
      affected_rows := r.affected_rows;
      RETURN NEXT;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_advisory_unlock(v_lock_key);
    RAISE;
  END;

  PERFORM pg_advisory_unlock(v_lock_key);
END;
$$;

REVOKE ALL ON FUNCTION public.run_village_automation_for_cron() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_village_automation_for_cron() TO service_role;

COMMENT ON FUNCTION public.run_village_automation_for_cron() IS
  'Cron HTTP: uruchamia run_village_automation() pod jednym advisory lock (brak równoległych duplikatów).';

-- --- B) Lease dla długich jobów (np. RSS) ---------------------------------------

CREATE TABLE IF NOT EXISTS public.cron_lease (
  job_key TEXT PRIMARY KEY,
  locked_until TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cron_lease_locked_until ON public.cron_lease (locked_until);

CREATE OR REPLACE FUNCTION public.cron_acquire_lease(p_key TEXT, p_ttl_seconds INT DEFAULT 900)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH up AS (
    INSERT INTO public.cron_lease (job_key, locked_until)
    VALUES (p_key, now() + make_interval(secs => p_ttl_seconds))
    ON CONFLICT (job_key) DO UPDATE
      SET locked_until = excluded.locked_until
      WHERE public.cron_lease.locked_until < now()
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM up);
$$;

CREATE OR REPLACE FUNCTION public.cron_release_lease(p_key TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.cron_lease WHERE job_key = p_key;
$$;

REVOKE ALL ON FUNCTION public.cron_acquire_lease(TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_release_lease(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cron_acquire_lease(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cron_release_lease(TEXT) TO service_role;

COMMENT ON TABLE public.cron_lease IS 'Krótkotrwałe lease crona (zwalniane po jobie lub po TTL).';
