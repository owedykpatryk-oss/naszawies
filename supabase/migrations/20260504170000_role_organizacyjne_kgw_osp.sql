-- Role organizacyjne w obrębie wsi: KGW / OSP / rada sołecka.
-- Cel: przygotować bazę pod granularne uprawnienia (RBAC), bez rozszerzania pełnych uprawnień sołtysa.

ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'kgw_przewodniczaca';
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'osp_naczelnik';
ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'rada_solecka';

-- Mieszkaniec + role zarządcze + role organizacyjne mają dostęp do podstawowych danych „resident”.
CREATE OR REPLACE FUNCTION public.is_village_resident(village_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_village_roles
    WHERE user_id = auth.uid()
      AND village_id = village_uuid
      AND role IN (
        'mieszkaniec',
        'soltys',
        'wspoladmin',
        'reprezentant_podmiotu',
        'kgw_przewodniczaca',
        'osp_naczelnik',
        'rada_solecka'
      )
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Specjalistyczne helpery pod przyszłe polityki RLS i dedykowane widoki panelu.
CREATE OR REPLACE FUNCTION public.is_village_kgw_lead(village_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_village_roles
    WHERE user_id = auth.uid()
      AND village_id = village_uuid
      AND role = 'kgw_przewodniczaca'
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_village_osp_lead(village_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_village_roles
    WHERE user_id = auth.uid()
      AND village_id = village_uuid
      AND role = 'osp_naczelnik'
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER FUNCTION public.is_village_resident(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_village_kgw_lead(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_village_osp_lead(UUID) SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.is_village_kgw_lead(UUID) IS
  'Sprawdza, czy aktualny użytkownik ma aktywną rolę przewodniczącej KGW dla wskazanej wsi.';
COMMENT ON FUNCTION public.is_village_osp_lead(UUID) IS
  'Sprawdza, czy aktualny użytkownik ma aktywną rolę naczelnika OSP dla wskazanej wsi.';
