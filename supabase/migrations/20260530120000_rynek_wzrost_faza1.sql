-- Faza 1 wzrostu rynku: licznik wyświetleń, obserwacja ceny przy zapisanych ogłoszeniach.

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.marketplace_listings.view_count IS
  'Liczba odsłon publicznej strony ogłoszenia (tylko approved).';

ALTER TABLE public.user_saved_content
  ADD COLUMN IF NOT EXISTS price_snapshot NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS watch_price BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_saved_content.price_snapshot IS
  'Cena ogłoszenia w momencie włączenia obserwacji (tylko content_type=listing).';
COMMENT ON COLUMN public.user_saved_content.watch_price IS
  'Powiadomienie przy zmianie ceny zapisanego ogłoszenia na rynku.';

CREATE INDEX IF NOT EXISTS idx_user_saved_content_listing_watch
  ON public.user_saved_content (content_id)
  WHERE content_type = 'listing' AND watch_price = true;

CREATE OR REPLACE FUNCTION public.increment_marketplace_listing_view(p_listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_listings
  SET view_count = view_count + 1
  WHERE id = p_listing_id
    AND status = 'approved';
END;
$$;

REVOKE ALL ON FUNCTION public.increment_marketplace_listing_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_marketplace_listing_view(UUID) TO anon, authenticated, service_role;
