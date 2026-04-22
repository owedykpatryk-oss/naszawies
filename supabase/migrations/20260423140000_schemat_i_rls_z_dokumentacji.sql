-- Wygenerowano z Cloude Docs/naszawies-package/database/schema.sql + rls-policies.sql
-- Nie edytuj ręcznie — odtwórz: node scripts/generuj-migracje-schema-z-dokumentow.mjs

-- ============================================================================
-- naszawies.pl — Supabase Database Schema
-- ============================================================================
-- Uruchom w Supabase SQL Editor w następującej kolejności:
-- 1. Extensions
-- 2. Enums
-- 3. Tables
-- 4. Indexes
-- 5. Triggers
-- 6. RLS Policies (w osobnym pliku rls-policies.sql)
-- ============================================================================

-- =========================================
-- EXTENSIONS
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;

-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE user_role_type AS ENUM ('mieszkaniec', 'soltys', 'wspoladmin', 'reprezentant_podmiotu');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'deleted');
CREATE TYPE post_type AS ENUM ('ogloszenie', 'wydarzenie', 'zebranie', 'awaria', 'ogloszenie_drobne');
CREATE TYPE post_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');
CREATE TYPE entity_type AS ENUM ('parafia', 'osp', 'kgw', 'klub_seniora', 'kolo_lowieckie', 'firma', 'sklep', 'szkola', 'biblioteka', 'inna_organizacja');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed');
CREATE TYPE issue_status AS ENUM ('nowe', 'w_trakcie', 'rozwiazane', 'odrzucone');
CREATE TYPE issue_category AS ENUM ('droga', 'oswietlenie', 'woda', 'prad', 'smieci', 'infrastruktura', 'inne');

-- =========================================
-- USERS (rozszerzenie auth.users)
-- =========================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  account_status account_status DEFAULT 'active',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  scheduled_deletion_at TIMESTAMPTZ
);
CREATE INDEX idx_users_status ON users(account_status);

-- =========================================
-- VILLAGES (z TERYT)
-- =========================================
CREATE TABLE villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teryt_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  voivodeship TEXT NOT NULL,
  county TEXT NOT NULL,
  commune TEXT NOT NULL,
  commune_type TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  population INTEGER,
  description TEXT,
  cover_image_url TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT false,
  soltys_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voivodeship, county, commune, slug)
);
CREATE INDEX idx_villages_teryt ON villages(teryt_id);
CREATE INDEX idx_villages_slug ON villages(voivodeship, county, commune, slug);
CREATE INDEX idx_villages_active ON villages(is_active) WHERE is_active = true;
CREATE INDEX idx_villages_name_trgm ON villages USING gin (name gin_trgm_ops);

-- =========================================
-- USER VILLAGE ROLES
-- =========================================
CREATE TABLE user_village_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  status account_status DEFAULT 'pending',
  verification_notes TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, village_id, role)
);
CREATE INDEX idx_uvr_user ON user_village_roles(user_id);
CREATE INDEX idx_uvr_village ON user_village_roles(village_id);
CREATE INDEX idx_uvr_role ON user_village_roles(role);
CREATE UNIQUE INDEX idx_uvr_one_soltys_per_village
  ON user_village_roles(village_id)
  WHERE role = 'soltys' AND status = 'active';

-- =========================================
-- USER FOLLOWS
-- =========================================
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  notify_posts BOOLEAN DEFAULT true,
  notify_events BOOLEAN DEFAULT true,
  notify_issues BOOLEAN DEFAULT false,
  notify_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, village_id)
);
CREATE INDEX idx_follows_user ON user_follows(user_id);
CREATE INDEX idx_follows_village ON user_follows(village_id);

-- =========================================
-- POSTS
-- =========================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type post_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  cover_image_url TEXT,
  event_start_at TIMESTAMPTZ,
  event_end_at TIMESTAMPTZ,
  event_location TEXT,
  category TEXT,
  tags TEXT[],
  status post_status DEFAULT 'pending',
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_village ON posts(village_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_event_date ON posts(event_start_at) WHERE type = 'wydarzenie';
CREATE INDEX idx_posts_tags ON posts USING gin(tags);

-- =========================================
-- COMMENTS
-- =========================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status post_status DEFAULT 'approved',
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);

-- =========================================
-- HALLS (świetlice)
-- =========================================
CREATE TABLE halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  area_m2 NUMERIC(6, 1),
  max_capacity INTEGER,
  contact_phone TEXT,
  contact_email TEXT,
  caretaker_name TEXT,
  price_resident NUMERIC(10, 2),
  price_external NUMERIC(10, 2),
  deposit NUMERIC(10, 2),
  layout_data JSONB,
  rules_text TEXT,
  rules_file_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_halls_village ON halls(village_id);

-- =========================================
-- HALL INVENTORY
-- =========================================
CREATE TABLE hall_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER,
  condition TEXT DEFAULT 'good',
  width_cm INTEGER,
  length_cm INTEGER,
  height_cm INTEGER,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inventory_hall ON hall_inventory(hall_id);
CREATE INDEX idx_inventory_category ON hall_inventory(category);

-- =========================================
-- HALL BOOKINGS
-- =========================================
CREATE TABLE hall_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  booked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  event_title TEXT,
  expected_guests INTEGER NOT NULL,
  has_alcohol BOOLEAN DEFAULT false,
  contact_phone TEXT,
  layout_data JSONB,
  requested_inventory JSONB,
  status booking_status DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_completed BOOLEAN DEFAULT false,
  completion_notes TEXT,
  was_damaged BOOLEAN DEFAULT false,
  rules_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bookings_hall ON hall_bookings(hall_id);
CREATE INDEX idx_bookings_user ON hall_bookings(booked_by);
CREATE INDEX idx_bookings_dates ON hall_bookings(start_at, end_at);
CREATE INDEX idx_bookings_status ON hall_bookings(status);

-- =========================================
-- ENTITIES (parafie, firmy, KGW, OSP...)
-- =========================================
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  type entity_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  opening_hours JSONB,
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[],
  status account_status DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_entities_village ON entities(village_id);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_status ON entities(status);

CREATE TABLE entity_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, user_id)
);
CREATE INDEX idx_entity_reps_entity ON entity_representatives(entity_id);
CREATE INDEX idx_entity_reps_user ON entity_representatives(user_id);

-- =========================================
-- ISSUES (zgłoszenia)
-- =========================================
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category issue_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_text TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  image_urls TEXT[],
  status issue_status DEFAULT 'nowe',
  assigned_to UUID REFERENCES users(id),
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_issues_village ON issues(village_id);
CREATE INDEX idx_issues_reporter ON issues(reporter_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category);

-- =========================================
-- POIs (mapa wsi)
-- =========================================
CREATE TABLE pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  linked_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  opening_hours JSONB,
  phone TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pois_village ON pois(village_id);
CREATE INDEX idx_pois_category ON pois(category);

-- =========================================
-- PHOTOS & ALBUMS
-- =========================================
CREATE TABLE photo_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID,
  event_date DATE,
  tags TEXT[],
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_albums_village ON photo_albums(village_id);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  album_id UUID REFERENCES photo_albums(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  location_text TEXT,
  status post_status DEFAULT 'pending',
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_photos_village ON photos(village_id);
CREATE INDEX idx_photos_album ON photos(album_id);
CREATE INDEX idx_photos_status ON photos(status);

ALTER TABLE photo_albums
  ADD CONSTRAINT fk_album_cover FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link_url TEXT,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'in_app',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- =========================================
-- MODERATION REPORTS
-- =========================================
CREATE TABLE moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_type TEXT NOT NULL,
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'new',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  is_trusted_flagger BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mod_reports_status ON moderation_reports(status);
CREATE INDEX idx_mod_reports_type ON moderation_reports(reported_type);

-- =========================================
-- AUDIT LOG
-- =========================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);


-- =========================================
-- WAITLIST — tabela już utworzona w migracji 20250422130000; dodajemy FK do users
-- =========================================
ALTER TABLE public.waitlist
  DROP CONSTRAINT IF EXISTS waitlist_converted_user_id_fkey;
ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_converted_user_id_fkey
  FOREIGN KEY (converted_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- =========================================
-- TRIGGERS
-- =========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uvr_updated_at BEFORE UPDATE ON user_village_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_halls_updated_at BEFORE UPDATE ON halls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON hall_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON hall_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pois_updated_at BEFORE UPDATE ON pois FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON photo_albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Aktywacja wsi po zatwierdzeniu sołtysa
CREATE OR REPLACE FUNCTION activate_village_on_soltys_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'soltys' AND NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    UPDATE villages
    SET is_active = true,
        soltys_user_id = NEW.user_id,
        updated_at = NOW()
    WHERE id = NEW.village_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activate_village
  AFTER INSERT OR UPDATE ON user_village_roles
  FOR EACH ROW EXECUTE FUNCTION activate_village_on_soltys_approval();

-- Automatyczne utworzenie user po rejestracji w auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =========================================
-- KONIEC SCHEMATU
-- =========================================
-- Następny krok: uruchom rls-policies.sql


-- === RLS (z rls-policies.sql) ===
-- ============================================================================
-- naszawies.pl — Row Level Security (RLS) Policies
-- ============================================================================
-- Uruchom PO schema.sql
-- Te polityki decydują kto co może zobaczyć i zmienić
-- ============================================================================

-- =========================================
-- WŁĄCZ RLS NA WSZYSTKICH TABELACH
-- =========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_village_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

-- Czy użytkownik jest sołtysem danej wsi?
CREATE OR REPLACE FUNCTION is_village_soltys(village_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_village_roles
    WHERE user_id = auth.uid()
      AND village_id = village_uuid
      AND role IN ('soltys', 'wspoladmin')
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Czy użytkownik jest mieszkańcem danej wsi?
CREATE OR REPLACE FUNCTION is_village_resident(village_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_village_roles
    WHERE user_id = auth.uid()
      AND village_id = village_uuid
      AND role IN ('mieszkaniec', 'soltys', 'wspoladmin', 'reprezentant_podmiotu')
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Czy użytkownik jest platformowym adminem?
-- Na start: lista mailowa hardcoded
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email IN ('admin@naszawies.pl', 'TWOJ_EMAIL@example.com')  -- UZUPEŁNIJ
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =========================================
-- USERS
-- =========================================

-- Każdy widzi publiczne dane użytkownika (display_name, avatar, bio)
CREATE POLICY "Public user profiles visible"
ON users FOR SELECT
USING (account_status = 'active');

-- Użytkownik edytuje swoje dane
CREATE POLICY "Users update own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- Admin widzi wszystko
CREATE POLICY "Admin full access to users"
ON users FOR ALL
USING (is_platform_admin());

-- =========================================
-- VILLAGES
-- =========================================

-- Każdy widzi wszystkie wsie (publiczne)
CREATE POLICY "Villages publicly visible"
ON villages FOR SELECT
USING (true);

-- Sołtys edytuje profil swojej wsi
CREATE POLICY "Soltys edits own village"
ON villages FOR UPDATE
USING (is_village_soltys(id));

-- Admin zarządza wszystkim
CREATE POLICY "Admin full access to villages"
ON villages FOR ALL
USING (is_platform_admin());

-- =========================================
-- USER_VILLAGE_ROLES
-- =========================================

-- Użytkownik widzi swoje role
CREATE POLICY "Users see own roles"
ON user_village_roles FOR SELECT
USING (user_id = auth.uid());

-- Sołtys widzi role w swojej wsi
CREATE POLICY "Soltys sees roles in own village"
ON user_village_roles FOR SELECT
USING (is_village_soltys(village_id));

-- Użytkownik tworzy zgłoszenie o rolę dla siebie
CREATE POLICY "Users create own role applications"
ON user_village_roles FOR INSERT
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Sołtys zatwierdza Mieszkańców w swojej wsi
CREATE POLICY "Soltys approves residents"
ON user_village_roles FOR UPDATE
USING (
  is_village_soltys(village_id)
  AND role IN ('mieszkaniec', 'wspoladmin', 'reprezentant_podmiotu')
);

-- Admin zarządza wszystkim (w tym sołtysami)
CREATE POLICY "Admin manages all roles"
ON user_village_roles FOR ALL
USING (is_platform_admin());

-- =========================================
-- USER_FOLLOWS
-- =========================================

CREATE POLICY "Users manage own follows"
ON user_follows FOR ALL
USING (user_id = auth.uid());

-- =========================================
-- POSTS
-- =========================================

-- Każdy widzi publiczne opublikowane posty
CREATE POLICY "Public approved posts visible"
ON posts FOR SELECT
USING (status = 'approved' AND is_public = true);

-- Mieszkaniec widzi wszystkie zatwierdzone posty swojej wsi
CREATE POLICY "Residents see all village posts"
ON posts FOR SELECT
USING (
  status = 'approved'
  AND is_village_resident(village_id)
);

-- Autor widzi swoje posty (także pending)
CREATE POLICY "Authors see own posts"
ON posts FOR SELECT
USING (author_id = auth.uid());

-- Sołtys widzi wszystkie posty swojej wsi (także pending)
CREATE POLICY "Soltys sees all village posts"
ON posts FOR SELECT
USING (is_village_soltys(village_id));

-- Zarejestrowany tworzy post (trafia do moderacji)
CREATE POLICY "Authenticated users create posts"
ON posts FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND author_id = auth.uid()
  AND status = 'pending'
);

-- Sołtys tworzy post od razu approved
CREATE POLICY "Soltys creates approved posts"
ON posts FOR INSERT
WITH CHECK (
  is_village_soltys(village_id)
  AND author_id = auth.uid()
);

-- Autor edytuje swoje posty (tylko draft/pending)
CREATE POLICY "Authors edit own pending posts"
ON posts FOR UPDATE
USING (
  author_id = auth.uid()
  AND status IN ('draft', 'pending')
);

-- Sołtys moderuje posty swojej wsi
CREATE POLICY "Soltys moderates village posts"
ON posts FOR UPDATE
USING (is_village_soltys(village_id));

-- Sołtys usuwa posty swojej wsi
CREATE POLICY "Soltys deletes village posts"
ON posts FOR DELETE
USING (is_village_soltys(village_id));

-- Admin pełen dostęp
CREATE POLICY "Admin full access to posts"
ON posts FOR ALL
USING (is_platform_admin());

-- =========================================
-- COMMENTS
-- =========================================

-- Każdy widzi zatwierdzone komentarze
CREATE POLICY "Approved comments visible"
ON comments FOR SELECT
USING (status = 'approved');

-- Autor widzi swoje komentarze
CREATE POLICY "Authors see own comments"
ON comments FOR SELECT
USING (author_id = auth.uid());

-- Zarejestrowany tworzy komentarz
CREATE POLICY "Authenticated users comment"
ON comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

-- Autor edytuje swój komentarz
CREATE POLICY "Authors edit own comments"
ON comments FOR UPDATE
USING (author_id = auth.uid());

-- Sołtys moderuje komentarze w swojej wsi
CREATE POLICY "Soltys moderates comments"
ON comments FOR ALL
USING (
  post_id IN (
    SELECT id FROM posts
    WHERE is_village_soltys(village_id)
  )
);

-- =========================================
-- HALLS
-- =========================================

-- Publiczny podgląd świetlic
CREATE POLICY "Halls publicly visible"
ON halls FOR SELECT
USING (true);

-- Sołtys zarządza świetlicą
CREATE POLICY "Soltys manages halls"
ON halls FOR ALL
USING (is_village_soltys(village_id));

-- =========================================
-- HALL_INVENTORY
-- =========================================

CREATE POLICY "Inventory publicly visible"
ON hall_inventory FOR SELECT
USING (true);

CREATE POLICY "Soltys manages inventory"
ON hall_inventory FOR ALL
USING (
  hall_id IN (
    SELECT id FROM halls WHERE is_village_soltys(village_id)
  )
);

-- =========================================
-- HALL_BOOKINGS
-- =========================================

-- Mieszkaniec widzi swoje rezerwacje
CREATE POLICY "Users see own bookings"
ON hall_bookings FOR SELECT
USING (booked_by = auth.uid());

-- Sołtys widzi wszystkie rezerwacje swoich świetlic
CREATE POLICY "Soltys sees all village bookings"
ON hall_bookings FOR SELECT
USING (
  hall_id IN (
    SELECT id FROM halls WHERE is_village_soltys(village_id)
  )
);

-- Zarejestrowany tworzy rezerwację
CREATE POLICY "Authenticated users book halls"
ON hall_bookings FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND booked_by = auth.uid());

-- Użytkownik anuluje swoją rezerwację (tylko pending)
CREATE POLICY "Users cancel own pending bookings"
ON hall_bookings FOR UPDATE
USING (booked_by = auth.uid() AND status = 'pending');

-- Sołtys zarządza rezerwacjami w swojej wsi
CREATE POLICY "Soltys manages bookings"
ON hall_bookings FOR UPDATE
USING (
  hall_id IN (
    SELECT id FROM halls WHERE is_village_soltys(village_id)
  )
);

-- =========================================
-- ENTITIES
-- =========================================

CREATE POLICY "Approved entities visible"
ON entities FOR SELECT
USING (status = 'active');

CREATE POLICY "Representatives see own entity"
ON entities FOR SELECT
USING (
  id IN (
    SELECT entity_id FROM entity_representatives WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Soltys sees village entities"
ON entities FOR SELECT
USING (is_village_soltys(village_id));

CREATE POLICY "Authenticated users propose entities"
ON entities FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND status = 'pending');

CREATE POLICY "Representatives edit own entity"
ON entities FOR UPDATE
USING (
  id IN (
    SELECT entity_id FROM entity_representatives WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Soltys approves entities"
ON entities FOR UPDATE
USING (is_village_soltys(village_id));

-- =========================================
-- ENTITY_REPRESENTATIVES
-- =========================================

CREATE POLICY "Users see own entity representations"
ON entity_representatives FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Soltys sees village entity reps"
ON entity_representatives FOR SELECT
USING (
  entity_id IN (
    SELECT id FROM entities WHERE is_village_soltys(village_id)
  )
);

-- =========================================
-- ISSUES
-- =========================================

CREATE POLICY "Residents see village issues"
ON issues FOR SELECT
USING (is_village_resident(village_id));

CREATE POLICY "Residents report issues"
ON issues FOR INSERT
WITH CHECK (is_village_resident(village_id) AND reporter_id = auth.uid());

CREATE POLICY "Reporters edit own issues"
ON issues FOR UPDATE
USING (reporter_id = auth.uid() AND status = 'nowe');

CREATE POLICY "Soltys manages village issues"
ON issues FOR UPDATE
USING (is_village_soltys(village_id));

-- =========================================
-- POIs
-- =========================================

CREATE POLICY "POIs publicly visible"
ON pois FOR SELECT
USING (true);

CREATE POLICY "Soltys manages POIs"
ON pois FOR ALL
USING (is_village_soltys(village_id));

-- =========================================
-- PHOTOS & ALBUMS
-- =========================================

CREATE POLICY "Public photos visible"
ON photos FOR SELECT
USING (status = 'approved' AND visibility = 'public');

CREATE POLICY "Residents see residents-only photos"
ON photos FOR SELECT
USING (
  status = 'approved'
  AND visibility = 'residents_only'
  AND is_village_resident(village_id)
);

CREATE POLICY "Uploaders see own photos"
ON photos FOR SELECT
USING (uploaded_by = auth.uid());

CREATE POLICY "Authenticated users upload photos"
ON photos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid() AND status = 'pending');

CREATE POLICY "Soltys moderates photos"
ON photos FOR UPDATE
USING (is_village_soltys(village_id));

CREATE POLICY "Albums publicly visible"
ON photo_albums FOR SELECT
USING (visibility = 'public');

CREATE POLICY "Residents see residents-only albums"
ON photo_albums FOR SELECT
USING (visibility = 'residents_only' AND is_village_resident(village_id));

CREATE POLICY "Soltys manages albums"
ON photo_albums FOR ALL
USING (is_village_soltys(village_id));

-- =========================================
-- NOTIFICATIONS
-- =========================================

CREATE POLICY "Users see own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users mark own notifications as read"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- =========================================
-- MODERATION_REPORTS
-- =========================================

CREATE POLICY "Reporters see own reports"
ON moderation_reports FOR SELECT
USING (reporter_id = auth.uid());

CREATE POLICY "Authenticated users submit reports"
ON moderation_reports FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

CREATE POLICY "Admin manages all reports"
ON moderation_reports FOR ALL
USING (is_platform_admin());

-- =========================================
-- WAITLIST
-- =========================================

-- Każdy może zostać dodany do listy (landing page)
CREATE POLICY "Anyone can join waitlist"
ON waitlist FOR INSERT
WITH CHECK (true);

-- Tylko admin widzi waitlist
CREATE POLICY "Admin sees waitlist"
ON waitlist FOR SELECT
USING (is_platform_admin());

-- =========================================
-- KONIEC POLITYK RLS
-- =========================================

