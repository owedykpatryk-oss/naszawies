-- OSP v1: techniczne pola dla punktów czerpania wody na mapie.

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS osp_water_source_type TEXT
    CHECK (osp_water_source_type IN ('hydrant', 'staw', 'zbiornik', 'rzeka', 'inne')),
  ADD COLUMN IF NOT EXISTS osp_water_capacity_lpm INTEGER
    CHECK (osp_water_capacity_lpm IS NULL OR osp_water_capacity_lpm >= 0),
  ADD COLUMN IF NOT EXISTS osp_winter_access BOOLEAN,
  ADD COLUMN IF NOT EXISTS osp_heavy_truck_access BOOLEAN,
  ADD COLUMN IF NOT EXISTS osp_note TEXT;

CREATE INDEX IF NOT EXISTS idx_pois_osp_source_type
  ON public.pois(osp_water_source_type);

CREATE INDEX IF NOT EXISTS idx_pois_osp_category_village
  ON public.pois(village_id, category)
  WHERE category = 'osp_punkt_czerpania_wody';
