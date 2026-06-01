-- Obserwowanie profili firm / sklepów na rynku lokalnym + rodzaj profilu.

ALTER TABLE public.marketplace_profiles
  ADD COLUMN IF NOT EXISTS profile_kind TEXT NOT NULL DEFAULT 'firma';

ALTER TABLE public.marketplace_profiles
  DROP CONSTRAINT IF EXISTS marketplace_profiles_profile_kind_check;

ALTER TABLE public.marketplace_profiles
  ADD CONSTRAINT marketplace_profiles_profile_kind_check
  CHECK (profile_kind IN ('sklep', 'firma', 'gospodarstwo', 'uslugi'));

COMMENT ON COLUMN public.marketplace_profiles.profile_kind IS
  'Rodzaj wizytówki: sklep, firma, gospodarstwo, uslugi.';

CREATE TABLE IF NOT EXISTS public.marketplace_profile_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.marketplace_profiles(id) ON DELETE CASCADE,
  notify_new_listings BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_profile_follows_user
  ON public.marketplace_profile_follows (user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_profile_follows_profile
  ON public.marketplace_profile_follows (profile_id);

ALTER TABLE public.marketplace_profile_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own marketplace profile follows" ON public.marketplace_profile_follows;
CREATE POLICY "Users manage own marketplace profile follows"
  ON public.marketplace_profile_follows
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Właściciel profilu widzi kto obserwuje (tylko liczba przez RPC / agregat — bez PII innych użytkowników w SELECT).
DROP POLICY IF EXISTS "Profile owners see follow count via own profile" ON public.marketplace_profile_follows;
CREATE POLICY "Authenticated users can read follow rows for active profiles"
  ON public.marketplace_profile_follows
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_profiles mp
      WHERE mp.id = profile_id AND mp.is_active = true
    )
  );
