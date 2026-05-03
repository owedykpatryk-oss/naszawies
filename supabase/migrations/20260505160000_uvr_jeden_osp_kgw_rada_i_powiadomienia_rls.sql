-- Jedna aktywna rola OSP / KGW / rada sołecka na wieś (jak sołtys).
-- Własne wnioski pending o role organizacyjne + zatwierdzanie przez sołtysa.

CREATE UNIQUE INDEX IF NOT EXISTS idx_uvr_one_osp_naczelnik_per_village
  ON public.user_village_roles (village_id)
  WHERE role = 'osp_naczelnik' AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_uvr_one_kgw_przewodniczaca_per_village
  ON public.user_village_roles (village_id)
  WHERE role = 'kgw_przewodniczaca' AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_uvr_one_rada_solecka_per_village
  ON public.user_village_roles (village_id)
  WHERE role = 'rada_solecka' AND status = 'active';

COMMENT ON INDEX public.idx_uvr_one_osp_naczelnik_per_village IS
  'Co najwyżej jeden aktywny naczelnik OSP na wieś.';
COMMENT ON INDEX public.idx_uvr_one_kgw_przewodniczaca_per_village IS
  'Co najwyżej jedna aktywna przewodnicząca KGW na wieś.';
COMMENT ON INDEX public.idx_uvr_one_rada_solecka_per_village IS
  'Co najwyżej jedna aktywna rola rady sołeckiej na wieś (model jednej reprezentacji).';

DROP POLICY IF EXISTS "Users create own role applications" ON public.user_village_roles;
CREATE POLICY "Users create own role applications"
ON public.user_village_roles FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND role IN (
    'mieszkaniec',
    'osp_naczelnik',
    'kgw_przewodniczaca',
    'rada_solecka'
  )
);

DROP POLICY IF EXISTS "Soltys approves residents" ON public.user_village_roles;
CREATE POLICY "Soltys approves residents"
ON public.user_village_roles FOR UPDATE
TO authenticated
USING (
  public.is_village_soltys(village_id)
  AND role IN (
    'mieszkaniec',
    'wspoladmin',
    'reprezentant_podmiotu',
    'osp_naczelnik',
    'kgw_przewodniczaca',
    'rada_solecka'
  )
)
WITH CHECK (
  public.is_village_soltys(village_id)
  AND role IN (
    'mieszkaniec',
    'wspoladmin',
    'reprezentant_podmiotu',
    'osp_naczelnik',
    'kgw_przewodniczaca',
    'rada_solecka'
  )
);
