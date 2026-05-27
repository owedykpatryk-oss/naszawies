-- Integracja kreatora grafiki: ogłoszenia, kalendarz, tablica cyfrowa

ALTER TABLE public.village_graphic_designs
  ADD COLUMN IF NOT EXISTS linked_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_event_id UUID REFERENCES public.village_community_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured_on_digital_board BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_village_graphic_designs_digital_board
  ON public.village_graphic_designs(village_id, published_at DESC)
  WHERE is_public = true AND featured_on_digital_board = true;

COMMENT ON COLUMN public.village_graphic_designs.linked_post_id IS
  'Powiązane ogłoszenie na profilu wsi utworzone z plakatu.';
COMMENT ON COLUMN public.village_graphic_designs.linked_event_id IS
  'Powiązane wydarzenie w kalendarzu społeczności utworzone z plakatu.';
COMMENT ON COLUMN public.village_graphic_designs.featured_on_digital_board IS
  'Czy plakat ma rotować na tablicy cyfrowej świetlicy.';
