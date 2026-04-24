-- Sala (plan, cennik, regulamin w polu) i wyposażenie: tylko społeczność wsi, nie każdy zalogowany
-- w obrębie „aktywnej” wsi. Spójne z is_village_resident (mieszkaniec, sołtys, współadmin, reprezentant).
-- (Usunięty wyjątek: auth.uid() IS NOT NULL + villages.is_active.)

DROP POLICY IF EXISTS "Swietlice widoczne wg dostepu do wsi" ON public.halls;
CREATE POLICY "Swietlice tylko dla spolecznosci wsi"
ON public.halls
FOR SELECT
USING (is_platform_admin() OR is_village_resident(village_id));

DROP POLICY IF EXISTS "Wyposazenie swietlicy jak dostep do sali" ON public.hall_inventory;
CREATE POLICY "Wyposazenie tylko dla spolecznosci wsi"
ON public.hall_inventory
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = hall_id
      AND (is_platform_admin() OR is_village_resident(h.village_id))
  )
);
