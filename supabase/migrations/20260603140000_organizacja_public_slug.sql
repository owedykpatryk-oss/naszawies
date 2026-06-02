-- Publiczny slug organizacji (mini-strona pod /wies/.../kgw/{slug})

ALTER TABLE public.village_community_groups
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

ALTER TABLE public.village_community_groups
  DROP CONSTRAINT IF EXISTS village_community_groups_public_slug_len;

ALTER TABLE public.village_community_groups
  ADD CONSTRAINT village_community_groups_public_slug_len
  CHECK (public_slug IS NULL OR (char_length(public_slug) >= 2 AND char_length(public_slug) <= 80));

CREATE UNIQUE INDEX IF NOT EXISTS idx_village_community_groups_village_slug
  ON public.village_community_groups(village_id, public_slug)
  WHERE public_slug IS NOT NULL AND is_active = true;

COMMENT ON COLUMN public.village_community_groups.public_slug IS
  'Segment URL mini-strony organizacji (np. kgw-dabrowa). Pusty = slug z nazwy.';
