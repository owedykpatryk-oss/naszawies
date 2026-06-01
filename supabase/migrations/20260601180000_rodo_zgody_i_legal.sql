-- Zgody prawne (RODO) + skrót na profilu użytkownika

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS legal_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_bundle_version TEXT;

COMMENT ON COLUMN public.users.legal_accepted_at IS 'Ostatnia akceptacja pakietu regulamin + polityka (wersja w legal_bundle_version).';
COMMENT ON COLUMN public.users.legal_bundle_version IS 'Identyfikator wersji dokumentów (np. 2026-06-01).';

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  CONSTRAINT chk_user_consents_type CHECK (
    consent_type IN (
      'regulamin',
      'polityka_prywatnosci',
      'wiek_16',
      'cookies_info',
      'marketing'
    )
  ),
  CONSTRAINT chk_user_consents_source CHECK (
    source IN ('rejestracja', 'oauth_akceptacja', 'banner_cookies', 'profil', 'admin')
  ),
  UNIQUE (user_id, consent_type, document_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_accepted
  ON public.user_consents (user_id, accepted_at DESC);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own consents" ON public.user_consents;
CREATE POLICY "User reads own consents"
ON public.user_consents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User inserts own consents" ON public.user_consents;
CREATE POLICY "User inserts own consents"
ON public.user_consents FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Rejestracja e-mail: zgody z metadanych auth → public.users + user_consents
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nazwa TEXT;
  legal_at TIMESTAMPTZ;
  legal_ver TEXT;
BEGIN
  nazwa := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  legal_at := NULL;
  BEGIN
    legal_at := (NEW.raw_user_meta_data->>'legal_accepted_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    legal_at := NULL;
  END;
  legal_ver := NULLIF(trim(NEW.raw_user_meta_data->>'legal_bundle_version'), '');

  INSERT INTO public.users (id, display_name, legal_accepted_at, legal_bundle_version)
  VALUES (
    NEW.id,
    nazwa,
    CASE WHEN legal_at IS NOT NULL AND legal_ver IS NOT NULL THEN legal_at ELSE NULL END,
    CASE WHEN legal_at IS NOT NULL AND legal_ver IS NOT NULL THEN legal_ver ELSE NULL END
  );

  IF legal_at IS NOT NULL AND legal_ver IS NOT NULL THEN
    INSERT INTO public.user_consents (user_id, consent_type, document_version, accepted_at, source)
    VALUES
      (NEW.id, 'regulamin', legal_ver, legal_at, 'rejestracja'),
      (NEW.id, 'polityka_prywatnosci', legal_ver, legal_at, 'rejestracja'),
      (NEW.id, 'wiek_16', legal_ver, legal_at, 'rejestracja')
    ON CONFLICT (user_id, consent_type, document_version) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
