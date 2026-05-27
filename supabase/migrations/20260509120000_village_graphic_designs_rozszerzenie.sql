-- Rozszerzenie kreatora grafiki: publikacja, tło, canvas Fabric, QR, powiązanie z rezerwacją

ALTER TABLE public.village_graphic_designs
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_data_url TEXT,
  ADD COLUMN IF NOT EXISTS canvas_json JSONB,
  ADD COLUMN IF NOT EXISTS qr_url TEXT,
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.hall_bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_village_graphic_designs_public
  ON public.village_graphic_designs(village_id, published_at DESC)
  WHERE is_public = true;

DROP POLICY IF EXISTS "Public read published graphic designs" ON public.village_graphic_designs;
CREATE POLICY "Public read published graphic designs"
  ON public.village_graphic_designs FOR SELECT
  USING (is_public = true AND village_id IS NOT NULL);

COMMENT ON COLUMN public.village_graphic_designs.canvas_json IS
  'Stan edytora Fabric.js (warstwy drag-and-drop).';
COMMENT ON COLUMN public.village_graphic_designs.qr_url IS
  'Docelowy URL osadzony w kodzie QR na plakacie.';
