-- Schemat rzutu parteru sali (pomieszczenia) — osobno od `layout_data` (plan stołów).

ALTER TABLE public.halls
ADD COLUMN IF NOT EXISTS floor_plan_data jsonb;

COMMENT ON COLUMN public.halls.floor_plan_data IS
  'Opcjonalny rzut parteru (pomieszczenia) wygenerowany w panelu sołtysa — JSON, wersja w polu wersja.';
