-- Rynek: żywność, odbiór/dowóz, mapa, subskrypcje kategorii, weryfikacja sprzedawcy.

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pickup_in_village BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC(5, 1),
  ADD COLUMN IF NOT EXISTS seasonal_note TEXT,
  ADD COLUMN IF NOT EXISTS product_produced_at DATE,
  ADD COLUMN IF NOT EXISTS product_best_before DATE,
  ADD COLUMN IF NOT EXISTS is_organic BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allergens_text TEXT,
  ADD COLUMN IF NOT EXISTS sales_poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_verified BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_geo
  ON public.marketplace_listings(village_id, latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND status = 'approved';

CREATE TABLE IF NOT EXISTS public.marketplace_category_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  equipment_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_cat_sub_unique
  ON public.marketplace_category_subscriptions (user_id, village_id, COALESCE(equipment_category, ''));

CREATE INDEX IF NOT EXISTS idx_marketplace_cat_sub_user ON public.marketplace_category_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_cat_sub_village ON public.marketplace_category_subscriptions(village_id);

COMMENT ON COLUMN public.marketplace_category_subscriptions.equipment_category IS
  'Kod kategorii (np. ciagnik, miod) lub NULL = wszystkie nowe ogłoszenia we wsi.';

ALTER TABLE public.marketplace_category_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own marketplace category subs" ON public.marketplace_category_subscriptions;
CREATE POLICY "Users manage own marketplace category subs"
  ON public.marketplace_category_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_village_resident(village_id)
  );
