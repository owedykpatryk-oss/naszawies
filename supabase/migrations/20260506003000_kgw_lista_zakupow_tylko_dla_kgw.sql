-- Ograniczenie listy zakupów: tylko KGW (przewodnicząca) oraz sołtys/współadmin.

ALTER TABLE public.village_shopping_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public shopping list read active village" ON public.village_shopping_list_items;
DROP POLICY IF EXISTS "Residents insert shopping items" ON public.village_shopping_list_items;
DROP POLICY IF EXISTS "Residents update shopping items" ON public.village_shopping_list_items;
DROP POLICY IF EXISTS "Residents delete own or soltys any shopping" ON public.village_shopping_list_items;

CREATE POLICY "KGW reads shopping list"
ON public.village_shopping_list_items
FOR SELECT
USING (
  public.is_village_kgw_lead(village_id) OR public.is_village_soltys(village_id)
);

CREATE POLICY "KGW inserts shopping list items"
ON public.village_shopping_list_items
FOR INSERT
WITH CHECK (
  public.is_village_kgw_lead(village_id) OR public.is_village_soltys(village_id)
);

CREATE POLICY "KGW updates shopping list items"
ON public.village_shopping_list_items
FOR UPDATE
USING (
  public.is_village_kgw_lead(village_id) OR public.is_village_soltys(village_id)
)
WITH CHECK (
  public.is_village_kgw_lead(village_id) OR public.is_village_soltys(village_id)
);

CREATE POLICY "KGW deletes shopping list items"
ON public.village_shopping_list_items
FOR DELETE
USING (
  public.is_village_kgw_lead(village_id) OR public.is_village_soltys(village_id)
);
