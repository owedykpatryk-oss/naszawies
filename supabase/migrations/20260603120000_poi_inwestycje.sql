-- Inwestycje i planowane budowy na mapie wsi (sołtys + import OSM construction).

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS investment_status TEXT
    CHECK (investment_status IS NULL OR investment_status IN ('planowana', 'w_budowie', 'zakonczona', 'wstrzymana')),
  ADD COLUMN IF NOT EXISTS planned_completion_at DATE,
  ADD COLUMN IF NOT EXISTS document_url TEXT;

CREATE INDEX IF NOT EXISTS idx_pois_investment_status
  ON public.pois(village_id, category, investment_status)
  WHERE category = 'inwestycja';

COMMENT ON COLUMN public.pois.investment_status IS 'Status inwestycji (kategoria inwestycja): planowana, w_budowie, zakonczona, wstrzymana';
COMMENT ON COLUMN public.pois.planned_completion_at IS 'Planowany termin zakończenia inwestycji';
COMMENT ON COLUMN public.pois.document_url IS 'Link do uchwały, dokumentacji lub strony inwestycji';
