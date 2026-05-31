-- Propozycje POI od mieszkańców — kolejka zatwierdzenia przez sołtysa.

CREATE TABLE IF NOT EXISTS public.poi_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  proposed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT poi_proposal_name_len CHECK (char_length(trim(name)) BETWEEN 2 AND 200),
  CONSTRAINT poi_proposal_desc_len CHECK (description IS NULL OR char_length(description) <= 800)
);

CREATE INDEX IF NOT EXISTS idx_poi_proposals_village_status
  ON public.poi_proposals(village_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_poi_proposals_author
  ON public.poi_proposals(proposed_by, created_at DESC);

DROP TRIGGER IF EXISTS update_poi_proposals_updated_at ON public.poi_proposals;
CREATE TRIGGER update_poi_proposals_updated_at
BEFORE UPDATE ON public.poi_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.poi_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own poi proposals" ON public.poi_proposals;
CREATE POLICY "Members read own poi proposals"
ON public.poi_proposals
FOR SELECT
USING (
  proposed_by = auth.uid()
  OR public.is_village_soltys(village_id)
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS "Members create poi proposals" ON public.poi_proposals;
CREATE POLICY "Members create poi proposals"
ON public.poi_proposals
FOR INSERT
WITH CHECK (
  auth.uid() = proposed_by
  AND status = 'pending'
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
  )
);

DROP POLICY IF EXISTS "Soltys reviews poi proposals" ON public.poi_proposals;
CREATE POLICY "Soltys reviews poi proposals"
ON public.poi_proposals
FOR UPDATE
USING (public.is_village_soltys(village_id) OR public.is_platform_admin())
WITH CHECK (public.is_village_soltys(village_id) OR public.is_platform_admin());
