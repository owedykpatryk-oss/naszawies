-- Rolnictwo: ceny GUS (powiat) + lokalne ceny z potwierdzeniami mieszkańców.
-- Zakres sołtysa: moderacja treści → rada sołecka / współadmin (nie sam sołtys).

ALTER TABLE public.villages
  ADD COLUMN IF NOT EXISTS powiat_teryt_kod text
    GENERATED ALWAYS AS (
      CASE
        WHEN gmina_teryt_kod IS NOT NULL AND length(btrim(gmina_teryt_kod)) >= 4
          THEN left(btrim(gmina_teryt_kod), 4)
        ELSE NULL
      END
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_villages_powiat_teryt_kod
  ON public.villages (powiat_teryt_kod)
  WHERE powiat_teryt_kod IS NOT NULL;

-- Średnie ceny skupu z GUS BDL (poziom powiatu, miesięcznie)
CREATE TABLE IF NOT EXISTS public.agri_ceny_gus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  powiat_teryt_kod text NOT NULL,
  powiat_nazwa text,
  wojewodztwo text,
  product_key text NOT NULL,
  product_label text NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  value numeric NOT NULL,
  unit text NOT NULL,
  gus_var_id integer,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (powiat_teryt_kod, product_key, year, month)
);

CREATE INDEX IF NOT EXISTS idx_agri_ceny_gus_powiat_okres
  ON public.agri_ceny_gus (powiat_teryt_kod, year DESC, month DESC);

-- Lokalne zgłoszenia cen (bez moderacji sołtysa — weryfikacja społecznościowa)
CREATE TABLE IF NOT EXISTS public.agri_ceny_lokalne (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id uuid NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  poi_id uuid REFERENCES public.pois(id) ON DELETE SET NULL,
  product_key text NOT NULL,
  price_value numeric NOT NULL CHECK (price_value > 0),
  price_unit text NOT NULL,
  place_name text NOT NULL,
  place_lat numeric(10, 7),
  place_lon numeric(10, 7),
  observed_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  reported_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  confirmation_count integer NOT NULL DEFAULT 1 CHECK (confirmation_count >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agri_ceny_lokalne_place_len CHECK (char_length(trim(place_name)) BETWEEN 2 AND 200),
  CONSTRAINT agri_ceny_lokalne_notes_len CHECK (notes IS NULL OR char_length(notes) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_agri_ceny_lokalne_village
  ON public.agri_ceny_lokalne (village_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_agri_ceny_lokalne_product
  ON public.agri_ceny_lokalne (village_id, product_key, observed_at DESC);

-- Potwierdzenia innych mieszkańców („też zapłaciłem tyle w tym miejscu”)
CREATE TABLE IF NOT EXISTS public.agri_ceny_potwierdzenia (
  price_report_id uuid NOT NULL REFERENCES public.agri_ceny_lokalne(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  observed_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (price_report_id, user_id),
  CONSTRAINT agri_potwierdzenia_notes_len CHECK (notes IS NULL OR char_length(notes) <= 300)
);

CREATE OR REPLACE FUNCTION public.agri_bump_confirmation_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rid uuid;
BEGIN
  rid := COALESCE(NEW.price_report_id, OLD.price_report_id);
  UPDATE public.agri_ceny_lokalne
  SET
    confirmation_count = (
      SELECT count(*)::integer FROM public.agri_ceny_potwierdzenia p
      WHERE p.price_report_id = rid
    ) + 1,
    updated_at = now()
  WHERE id = rid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS agri_ceny_potwierdzenia_bump ON public.agri_ceny_potwierdzenia;
CREATE TRIGGER agri_ceny_potwierdzenia_bump
AFTER INSERT OR DELETE ON public.agri_ceny_potwierdzenia
FOR EACH ROW EXECUTE FUNCTION public.agri_bump_confirmation_count();

DROP TRIGGER IF EXISTS update_agri_ceny_lokalne_updated_at ON public.agri_ceny_lokalne;
CREATE TRIGGER update_agri_ceny_lokalne_updated_at
BEFORE UPDATE ON public.agri_ceny_lokalne
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Moderacja treści: rada sołecka + współadmin (nie sam sołtys)
CREATE OR REPLACE FUNCTION public.can_moderate_village_content(p_village_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_village_roles uvr
    WHERE uvr.village_id = p_village_id
      AND uvr.user_id = auth.uid()
      AND uvr.status = 'active'
      AND uvr.role IN ('rada_solecka', 'wspoladmin')
  );
$$;

-- RLS: agri_ceny_gus — odczyt publiczny
ALTER TABLE public.agri_ceny_gus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read agri gus prices" ON public.agri_ceny_gus;
CREATE POLICY "Public read agri gus prices"
ON public.agri_ceny_gus FOR SELECT
USING (true);

-- RLS: agri_ceny_lokalne
ALTER TABLE public.agri_ceny_lokalne ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read local agri prices" ON public.agri_ceny_lokalne;
CREATE POLICY "Public read local agri prices"
ON public.agri_ceny_lokalne FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Residents report local agri prices" ON public.agri_ceny_lokalne;
CREATE POLICY "Residents report local agri prices"
ON public.agri_ceny_lokalne FOR INSERT
WITH CHECK (
  reported_by = auth.uid()
  AND public.is_village_resident(village_id)
);

DROP POLICY IF EXISTS "Authors update own agri price reports" ON public.agri_ceny_lokalne;
CREATE POLICY "Authors update own agri price reports"
ON public.agri_ceny_lokalne FOR UPDATE
USING (reported_by = auth.uid())
WITH CHECK (reported_by = auth.uid());

-- RLS: potwierdzenia
ALTER TABLE public.agri_ceny_potwierdzenia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read agri confirmations" ON public.agri_ceny_potwierdzenia;
CREATE POLICY "Public read agri confirmations"
ON public.agri_ceny_potwierdzenia FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Residents confirm agri prices" ON public.agri_ceny_potwierdzenia;
CREATE POLICY "Residents confirm agri prices"
ON public.agri_ceny_potwierdzenia FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.agri_ceny_lokalne r
    WHERE r.id = price_report_id
      AND public.is_village_resident(r.village_id)
  )
  AND user_id <> (
    SELECT r.reported_by FROM public.agri_ceny_lokalne r WHERE r.id = price_report_id
  )
);

-- Posts: moderacja → rada / współadmin
DROP POLICY IF EXISTS "Soltys moderates village posts" ON public.posts;
DROP POLICY IF EXISTS "Council moderates village posts" ON public.posts;
CREATE POLICY "Council moderates village posts"
ON public.posts FOR UPDATE
USING (public.can_moderate_village_content(village_id));

DROP POLICY IF EXISTS "Soltys deletes village posts" ON public.posts;
DROP POLICY IF EXISTS "Council deletes village posts" ON public.posts;
CREATE POLICY "Council deletes village posts"
ON public.posts FOR DELETE
USING (public.can_moderate_village_content(village_id));

-- Marketplace
DROP POLICY IF EXISTS "Soltys moderates marketplace listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Council moderates marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Council moderates marketplace listings"
ON public.marketplace_listings FOR UPDATE
USING (public.can_moderate_village_content(village_id));

DROP POLICY IF EXISTS "Soltys deletes marketplace listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Council deletes marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Council deletes marketplace listings"
ON public.marketplace_listings FOR DELETE
USING (public.can_moderate_village_content(village_id));

-- Pomoc sąsiedzka
DROP POLICY IF EXISTS "Soltys moderates neighbor help" ON public.neighbor_help_offers;
DROP POLICY IF EXISTS "Council moderates neighbor help" ON public.neighbor_help_offers;
CREATE POLICY "Council moderates neighbor help"
ON public.neighbor_help_offers FOR UPDATE
USING (public.can_moderate_village_content(village_id));

-- Zdjęcia fotokroniki
DROP POLICY IF EXISTS "Soltys moderates photos" ON public.photos;
DROP POLICY IF EXISTS "Council moderates photos" ON public.photos;
CREATE POLICY "Council moderates photos"
ON public.photos FOR UPDATE
USING (public.can_moderate_village_content(village_id));

DROP POLICY IF EXISTS "Soltys deletes photos" ON public.photos;
DROP POLICY IF EXISTS "Council deletes photos" ON public.photos;
CREATE POLICY "Council deletes photos"
ON public.photos FOR DELETE
USING (public.can_moderate_village_content(village_id));

DROP POLICY IF EXISTS "Soltys moderates photo albums" ON public.photo_albums;
DROP POLICY IF EXISTS "Soltys manages albums" ON public.photo_albums;
DROP POLICY IF EXISTS "Council moderates photo albums" ON public.photo_albums;
CREATE POLICY "Council moderates photo albums"
ON public.photo_albums FOR UPDATE
USING (public.can_moderate_village_content(village_id));

-- Wiadomości lokalne
DROP POLICY IF EXISTS "Soltys moderates local news" ON public.local_news_items;
DROP POLICY IF EXISTS "Council moderates local news" ON public.local_news_items;
CREATE POLICY "Council moderates local news"
ON public.local_news_items FOR UPDATE
USING (public.can_moderate_village_content(village_id));

-- Blog (moderacja)
DROP POLICY IF EXISTS "Soltys moderates village blog posts" ON public.village_blog_posts;
DROP POLICY IF EXISTS "Council moderates village blog posts" ON public.village_blog_posts;
CREATE POLICY "Council moderates village blog posts"
ON public.village_blog_posts FOR ALL
USING (public.can_moderate_village_content(village_id));

-- Dyskusje
DROP POLICY IF EXISTS "Soltys moderates discussion threads" ON public.village_discussion_threads;
DROP POLICY IF EXISTS "Council moderates discussion threads" ON public.village_discussion_threads;
CREATE POLICY "Council moderates discussion threads"
ON public.village_discussion_threads FOR UPDATE
USING (public.can_moderate_village_content(village_id));

DROP POLICY IF EXISTS "Soltys moderates discussion comments" ON public.village_discussion_comments;
DROP POLICY IF EXISTS "Council moderates discussion comments" ON public.village_discussion_comments;
CREATE POLICY "Council moderates discussion comments"
ON public.village_discussion_comments FOR UPDATE
USING (public.can_moderate_village_content(village_id));

DROP POLICY IF EXISTS "Soltys reviews content reports" ON public.village_content_reports;
DROP POLICY IF EXISTS "Council reviews content reports" ON public.village_content_reports;
CREATE POLICY "Council reviews content reports"
ON public.village_content_reports FOR UPDATE
USING (public.can_moderate_village_content(village_id));

-- KGW: tylko przewodnicząca (+ współadmin), bez sołtysa
DROP POLICY IF EXISTS "KGW reads shopping list" ON public.village_shopping_list_items;
DROP POLICY IF EXISTS "KGW inserts shopping list items" ON public.village_shopping_list_items;
DROP POLICY IF EXISTS "KGW updates shopping list items" ON public.village_shopping_list_items;
DROP POLICY IF EXISTS "KGW deletes shopping list items" ON public.village_shopping_list_items;

CREATE POLICY "KGW reads shopping list"
ON public.village_shopping_list_items FOR SELECT
USING (
  public.is_village_kgw_lead(village_id)
  OR EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.village_id = village_shopping_list_items.village_id
      AND uvr.user_id = auth.uid() AND uvr.status = 'active' AND uvr.role = 'wspoladmin'
  )
);

CREATE POLICY "KGW inserts shopping list items"
ON public.village_shopping_list_items FOR INSERT
WITH CHECK (
  public.is_village_kgw_lead(village_id)
  OR EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.village_id = village_shopping_list_items.village_id
      AND uvr.user_id = auth.uid() AND uvr.status = 'active' AND uvr.role = 'wspoladmin'
  )
);

CREATE POLICY "KGW updates shopping list items"
ON public.village_shopping_list_items FOR UPDATE
USING (
  public.is_village_kgw_lead(village_id)
  OR EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.village_id = village_shopping_list_items.village_id
      AND uvr.user_id = auth.uid() AND uvr.status = 'active' AND uvr.role = 'wspoladmin'
  )
);

CREATE POLICY "KGW deletes shopping list items"
ON public.village_shopping_list_items FOR DELETE
USING (
  public.is_village_kgw_lead(village_id)
  OR EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.village_id = village_shopping_list_items.village_id
      AND uvr.user_id = auth.uid() AND uvr.status = 'active' AND uvr.role = 'wspoladmin'
  )
);

COMMENT ON TABLE public.agri_ceny_gus IS
  'Średnie miesięczne ceny skupu GUS BDL na poziomie powiatu — orientacja rynkowa, nie cena konkretnego skupu.';
COMMENT ON TABLE public.agri_ceny_lokalne IS
  'Ceny zgłaszane przez mieszkańców; wiarygodność rośnie z liczbą potwierdzeń (bez moderacji sołtysa).';
