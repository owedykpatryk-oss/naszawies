-- Rozszerzenia społecznościowe:
-- - profile blogerów i wpisy blogowe
-- - kronika / historia wsi
-- - darmowy marketplace (profile usług i ogłoszenia)
-- - lokalne wiadomości (manualne + automatyczne źródła)
-- - funkcja automatyzująca porządkowanie wpisów

-- =========================================
-- ENUMS
-- =========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'marketplace_listing_type'
  ) THEN
    CREATE TYPE public.marketplace_listing_type AS ENUM ('sprzedam', 'kupie', 'oddam', 'usluga', 'praca');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'publication_status'
  ) THEN
    CREATE TYPE public.publication_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');
  END IF;
END $$;

-- =========================================
-- BLOGERZY I BLOG WSI
-- =========================================
CREATE TABLE IF NOT EXISTS public.village_bloggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  specialties TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(village_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_village_bloggers_village ON public.village_bloggers(village_id);
CREATE INDEX IF NOT EXISTS idx_village_bloggers_user ON public.village_bloggers(user_id);

CREATE TABLE IF NOT EXISTS public.village_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  blogger_id UUID NOT NULL REFERENCES public.village_bloggers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status public.publication_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(village_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_village ON public.village_blog_posts(village_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.village_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.village_blog_posts(published_at DESC);

-- =========================================
-- KRONIKA / HISTORIA WSI
-- =========================================
CREATE TABLE IF NOT EXISTS public.village_history_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  body TEXT NOT NULL,
  event_date DATE,
  era_label TEXT,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  source_links TEXT[] NOT NULL DEFAULT '{}',
  status public.publication_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_entries_village ON public.village_history_entries(village_id);
CREATE INDEX IF NOT EXISTS idx_history_entries_status ON public.village_history_entries(status);
CREATE INDEX IF NOT EXISTS idx_history_entries_event_date ON public.village_history_entries(event_date DESC);

-- =========================================
-- DARMOWY MARKETPLACE
-- =========================================
CREATE TABLE IF NOT EXISTS public.marketplace_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  short_description TEXT,
  details TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  service_area TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(village_id, owner_user_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_profiles_village ON public.marketplace_profiles(village_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_profiles_owner ON public.marketplace_profiles(owner_user_id);

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.marketplace_profiles(id) ON DELETE SET NULL,
  listing_type public.marketplace_listing_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  price_amount NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'PLN',
  phone TEXT,
  location_text TEXT,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  status public.publication_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_village ON public.marketplace_listings(village_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON public.marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_expires ON public.marketplace_listings(expires_at);

-- =========================================
-- LOKALNE WIADOMOŚCI (MANUALNE + AUTO)
-- =========================================
CREATE TABLE IF NOT EXISTS public.local_news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  source_name TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_automated BOOLEAN NOT NULL DEFAULT false,
  status public.publication_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_local_news_village ON public.local_news_items(village_id);
CREATE INDEX IF NOT EXISTS idx_local_news_status ON public.local_news_items(status);
CREATE INDEX IF NOT EXISTS idx_local_news_published ON public.local_news_items(published_at DESC);

-- =========================================
-- UPDATED_AT TRIGGERS
-- =========================================
DROP TRIGGER IF EXISTS update_village_bloggers_updated_at ON public.village_bloggers;
CREATE TRIGGER update_village_bloggers_updated_at
BEFORE UPDATE ON public.village_bloggers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_blog_posts_updated_at ON public.village_blog_posts;
CREATE TRIGGER update_village_blog_posts_updated_at
BEFORE UPDATE ON public.village_blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_history_entries_updated_at ON public.village_history_entries;
CREATE TRIGGER update_village_history_entries_updated_at
BEFORE UPDATE ON public.village_history_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_profiles_updated_at ON public.marketplace_profiles;
CREATE TRIGGER update_marketplace_profiles_updated_at
BEFORE UPDATE ON public.marketplace_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER update_marketplace_listings_updated_at
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_local_news_items_updated_at ON public.local_news_items;
CREATE TRIGGER update_local_news_items_updated_at
BEFORE UPDATE ON public.local_news_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PUBLIKACJA: status approved => published_at
-- =========================================
CREATE OR REPLACE FUNCTION public.set_publication_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  IF NEW.status = 'archived' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_publication_timestamp_blog_posts ON public.village_blog_posts;
CREATE TRIGGER trg_set_publication_timestamp_blog_posts
BEFORE UPDATE ON public.village_blog_posts
FOR EACH ROW EXECUTE FUNCTION public.set_publication_timestamp();

DROP TRIGGER IF EXISTS trg_set_publication_timestamp_history ON public.village_history_entries;
CREATE TRIGGER trg_set_publication_timestamp_history
BEFORE UPDATE ON public.village_history_entries
FOR EACH ROW EXECUTE FUNCTION public.set_publication_timestamp();

DROP TRIGGER IF EXISTS trg_set_publication_timestamp_marketplace ON public.marketplace_listings;
CREATE TRIGGER trg_set_publication_timestamp_marketplace
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION public.set_publication_timestamp();

DROP TRIGGER IF EXISTS trg_set_publication_timestamp_news ON public.local_news_items;
CREATE TRIGGER trg_set_publication_timestamp_news
BEFORE UPDATE ON public.local_news_items
FOR EACH ROW EXECUTE FUNCTION public.set_publication_timestamp();

-- =========================================
-- AUTOMATYZACJE
-- =========================================
CREATE OR REPLACE FUNCTION public.run_village_automation()
RETURNS TABLE(action TEXT, affected_rows BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows BIGINT;
BEGIN
  UPDATE public.marketplace_listings
  SET status = 'archived',
      archived_at = now(),
      moderation_note = COALESCE(moderation_note, 'Zarchiwizowano automatycznie po terminie ważności.')
  WHERE status IN ('approved', 'pending')
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_marketplace_listings';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.local_news_items
  SET status = 'archived',
      moderation_note = COALESCE(moderation_note, 'Wiadomość wygasła automatycznie.')
  WHERE status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_local_news';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.village_bloggers b
  SET is_active = false
  WHERE b.is_active = true
    AND b.updated_at < now() - interval '365 days'
    AND NOT EXISTS (
      SELECT 1
      FROM public.village_blog_posts p
      WHERE p.blogger_id = b.id
        AND p.created_at > now() - interval '365 days'
    );
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'deactivate_orphan_bloggers';
  affected_rows := v_rows;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.run_village_automation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_village_automation() TO authenticated;

-- =========================================
-- RLS
-- =========================================
ALTER TABLE public.village_bloggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_history_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_news_items ENABLE ROW LEVEL SECURITY;

-- Blogerzy: publiczny odczyt aktywnych profili
DROP POLICY IF EXISTS "Public active bloggers visible" ON public.village_bloggers;
CREATE POLICY "Public active bloggers visible"
ON public.village_bloggers
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Owner manages own blogger profile" ON public.village_bloggers;
CREATE POLICY "Owner manages own blogger profile"
ON public.village_bloggers
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Soltys manages village bloggers" ON public.village_bloggers;
CREATE POLICY "Soltys manages village bloggers"
ON public.village_bloggers
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- Blog wpisy
DROP POLICY IF EXISTS "Public approved blog posts visible" ON public.village_blog_posts;
CREATE POLICY "Public approved blog posts visible"
ON public.village_blog_posts
FOR SELECT
USING (status = 'approved');

DROP POLICY IF EXISTS "Authors manage own blog posts" ON public.village_blog_posts;
CREATE POLICY "Authors manage own blog posts"
ON public.village_blog_posts
FOR ALL
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Soltys moderates village blog posts" ON public.village_blog_posts;
CREATE POLICY "Soltys moderates village blog posts"
ON public.village_blog_posts
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- Historia
DROP POLICY IF EXISTS "Public approved history entries visible" ON public.village_history_entries;
CREATE POLICY "Public approved history entries visible"
ON public.village_history_entries
FOR SELECT
USING (status = 'approved');

DROP POLICY IF EXISTS "Authors manage own history entries" ON public.village_history_entries;
CREATE POLICY "Authors manage own history entries"
ON public.village_history_entries
FOR ALL
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Soltys moderates village history entries" ON public.village_history_entries;
CREATE POLICY "Soltys moderates village history entries"
ON public.village_history_entries
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- Marketplace profile
DROP POLICY IF EXISTS "Public active marketplace profiles visible" ON public.marketplace_profiles;
CREATE POLICY "Public active marketplace profiles visible"
ON public.marketplace_profiles
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Owners manage own marketplace profiles" ON public.marketplace_profiles;
CREATE POLICY "Owners manage own marketplace profiles"
ON public.marketplace_profiles
FOR ALL
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Soltys manages village marketplace profiles" ON public.marketplace_profiles;
CREATE POLICY "Soltys manages village marketplace profiles"
ON public.marketplace_profiles
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- Marketplace listings
DROP POLICY IF EXISTS "Public approved marketplace listings visible" ON public.marketplace_listings;
CREATE POLICY "Public approved marketplace listings visible"
ON public.marketplace_listings
FOR SELECT
USING (status = 'approved');

DROP POLICY IF EXISTS "Owners manage own marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Owners manage own marketplace listings"
ON public.marketplace_listings
FOR ALL
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Soltys moderates village marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Soltys moderates village marketplace listings"
ON public.marketplace_listings
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- Local news
DROP POLICY IF EXISTS "Public approved local news visible" ON public.local_news_items;
CREATE POLICY "Public approved local news visible"
ON public.local_news_items
FOR SELECT
USING (status = 'approved');

DROP POLICY IF EXISTS "Creators manage own local news draft" ON public.local_news_items;
CREATE POLICY "Creators manage own local news draft"
ON public.local_news_items
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Soltys moderates village local news" ON public.local_news_items;
CREATE POLICY "Soltys moderates village local news"
ON public.local_news_items
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));
