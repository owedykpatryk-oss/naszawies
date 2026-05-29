-- Kolumny regionu GUS (NUTS2) — ceny skupu nie są dostępne na poziomie powiatu w BDL.

ALTER TABLE public.agri_ceny_gus
  ADD COLUMN IF NOT EXISTS gus_region_id text,
  ADD COLUMN IF NOT EXISTS gus_region_nazwa text;

COMMENT ON COLUMN public.agri_ceny_gus.gus_region_id IS
  'Id jednostki BDL poziomu region (NUTS2) — źródło danych GUS dla cen skupu.';
COMMENT ON COLUMN public.agri_ceny_gus.gus_region_nazwa IS
  'Nazwa regionu statystycznego GUS przypisanego do powiatu.';
