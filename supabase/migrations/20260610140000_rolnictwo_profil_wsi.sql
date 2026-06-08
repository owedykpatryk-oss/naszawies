-- Profil rolnictwa wsi (ARiMR, dopłaty, skup, ostrzeżenia sezonowe)

CREATE TABLE IF NOT EXISTS public.village_agriculture_profiles (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.village_agriculture_profiles IS
  'Profil rolniczy wsi: ARiMR, ODR, dopłaty, skup, ostrzeżenia (schemaProfilRolnictwa).';

DROP TRIGGER IF EXISTS update_village_agriculture_profiles_updated_at ON public.village_agriculture_profiles;
CREATE TRIGGER update_village_agriculture_profiles_updated_at
BEFORE UPDATE ON public.village_agriculture_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_agriculture_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published agriculture profiles" ON public.village_agriculture_profiles;
CREATE POLICY "Public read published agriculture profiles"
ON public.village_agriculture_profiles
FOR SELECT
USING (is_published = true);

-- Polityki sołtysa (INSERT/UPDATE/DELETE/SELECT) — patrz 20260610150000_profil_rolnictwa_lesnictwo_rls_bezpieczenstwo.sql
