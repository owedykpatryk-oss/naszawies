-- Profil budynku świetlicy: parking + rekomendacja dla pozycji asortymentu

ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS parking_spaces INTEGER;

ALTER TABLE public.halls
  DROP CONSTRAINT IF EXISTS halls_parking_spaces_nonneg;

ALTER TABLE public.halls
  ADD CONSTRAINT halls_parking_spaces_nonneg
  CHECK (parking_spaces IS NULL OR parking_spaces >= 0);

COMMENT ON COLUMN public.halls.parking_spaces IS 'Liczba miejsc parkingowych przy budynku świetlicy (orientacyjnie).';

ALTER TABLE public.hall_inventory
  ADD COLUMN IF NOT EXISTS inventory_action TEXT NOT NULL DEFAULT 'in_use';

ALTER TABLE public.hall_inventory
  DROP CONSTRAINT IF EXISTS hall_inventory_action_check;

ALTER TABLE public.hall_inventory
  ADD CONSTRAINT hall_inventory_action_check
  CHECK (
    inventory_action IN (
      'in_use',
      'to_repair',
      'to_remove',
      'wishlist',
      'wishlist_wow'
    )
  );

COMMENT ON COLUMN public.hall_inventory.inventory_action IS
  'Rekomendacja sołtysa: in_use | to_repair | to_remove | wishlist | wishlist_wow (efekt WOW).';

CREATE INDEX IF NOT EXISTS idx_inventory_action ON public.hall_inventory(inventory_action);
