-- Lista oczekujących z landingu (Faza 0). Pełny schemat: Cloude Docs/naszawies-package/database/schema.sql

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  village_name TEXT,
  commune TEXT,
  role TEXT,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  notified_at TIMESTAMPTZ,
  converted_user_id UUID,
  consent_given_at TIMESTAMPTZ DEFAULT NOW(),
  consent_text_version TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist (created_at);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Kasuj polityki o tej samej nazwie przy ponownym uruchomieniu migracji (idempotentnie)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "anon moze zapisac waitlist" ON public.waitlist;

CREATE POLICY "anon moze zapisac waitlist"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON TABLE public.waitlist TO anon, authenticated;
