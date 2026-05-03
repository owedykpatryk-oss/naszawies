-- Kontakt urzędowy na profilu wsi: osoby funkcyjne, historia kadencji, status weryfikacji i CTA.

CREATE TABLE IF NOT EXISTS public.village_official_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  office_key TEXT NOT NULL CHECK (office_key IN ('soltys', 'parafia', 'osp', 'kgw', 'inne')),
  role_label TEXT NOT NULL,
  person_name TEXT NOT NULL,
  organization_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  duty_hours_text TEXT,
  note TEXT,
  cta_label TEXT,
  cta_url TEXT,
  is_verified_by_soltys BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 100,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_village_official_contacts_village
  ON public.village_official_contacts(village_id, is_active, display_order);

CREATE TABLE IF NOT EXISTS public.village_official_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  office_key TEXT NOT NULL CHECK (office_key IN ('soltys', 'parafia', 'osp', 'kgw', 'inne')),
  role_label TEXT NOT NULL,
  person_name TEXT NOT NULL,
  organization_name TEXT,
  term_start DATE NOT NULL,
  term_end DATE,
  note TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_village_official_terms_dates
    CHECK (term_end IS NULL OR term_end >= term_start)
);

CREATE INDEX IF NOT EXISTS idx_village_official_terms_village
  ON public.village_official_terms(village_id, office_key, term_start DESC);

DROP TRIGGER IF EXISTS update_village_official_contacts_updated_at ON public.village_official_contacts;
CREATE TRIGGER update_village_official_contacts_updated_at
BEFORE UPDATE ON public.village_official_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_official_terms_updated_at ON public.village_official_terms;
CREATE TRIGGER update_village_official_terms_updated_at
BEFORE UPDATE ON public.village_official_terms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_official_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_official_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public active official contacts visible" ON public.village_official_contacts;
CREATE POLICY "Public active official contacts visible"
ON public.village_official_contacts
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Soltys manages official contacts" ON public.village_official_contacts;
CREATE POLICY "Soltys manages official contacts"
ON public.village_official_contacts
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Public official terms visible" ON public.village_official_terms;
CREATE POLICY "Public official terms visible"
ON public.village_official_terms
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Soltys manages official terms" ON public.village_official_terms;
CREATE POLICY "Soltys manages official terms"
ON public.village_official_terms
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));
