-- Powiązanie pinezki POI z profilem organizacji (parafia, szkoła, OSP…)

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS linked_group_id UUID REFERENCES public.village_community_groups(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.pois.linked_group_id IS
  'Profil organizacji powiązany z pinezką (np. kościół → parafia, remiza → OSP).';

CREATE INDEX IF NOT EXISTS idx_pois_linked_group ON public.pois(linked_group_id)
  WHERE linked_group_id IS NOT NULL;
