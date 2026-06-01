-- Ręczny rozkład PKS przy przystanku (sołtys) — uzupełnienie cache GTFS / e-podróżnik

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS bus_schedule_manual JSONB;

COMMENT ON COLUMN public.pois.bus_schedule_manual IS
  'Ręczny rozkład autobusowy: { wersja: 1, kursy[], notatka?, linkPdf?, zaktualizowano? }. Priorytet nad cache przy wyświetlaniu.';

CREATE INDEX IF NOT EXISTS idx_pois_przystanek_rozklad
  ON public.pois (village_id)
  WHERE category = 'przystanek' AND bus_schedule_manual IS NOT NULL;
