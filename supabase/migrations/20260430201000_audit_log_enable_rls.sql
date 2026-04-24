-- Supabase linter 0013_rls_disabled_in_public: audit_log was created without RLS.
-- Inserts z Edge / service_role omijają RLS; klienci (anon/authenticated) bez polityk = brak dostępu.

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to audit_log"
ON public.audit_log
FOR ALL
USING (is_platform_admin());
