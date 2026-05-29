-- Banner sezonowy na stronie rynku lokalnego (edycja przez sołtysa).

ALTER TABLE public.villages
  ADD COLUMN IF NOT EXISTS rynek_banner_text TEXT,
  ADD COLUMN IF NOT EXISTS rynek_banner_until DATE;

COMMENT ON COLUMN public.villages.rynek_banner_text IS
  'Krótki komunikat na stronie /rynek (np. kiermasz, zbiory).';
COMMENT ON COLUMN public.villages.rynek_banner_until IS
  'Po tej dacie banner nie jest wyświetlany (włącznie z dniem granicznym).';
