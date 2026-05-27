-- Rynek lokalny: wynajem/wypożyczenie, kategorie maszyn, zdjęcia.
-- Komunikator: czat 1:1, grupy (mieszkańcy, KGW, myśliwi, OSP), kontakt z ogłoszenia.

-- 1) Typy ogłoszeń
DO $$ BEGIN
  ALTER TYPE public.marketplace_listing_type ADD VALUE IF NOT EXISTS 'wynajme';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.marketplace_listing_type ADD VALUE IF NOT EXISTS 'wypozycze';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS equipment_category TEXT,
  ADD COLUMN IF NOT EXISTS with_operator BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_unit TEXT;

COMMENT ON COLUMN public.marketplace_listings.equipment_category IS
  'Np. ciagnik, kombajn, konie, uslugi_z_operatorem — słownik w aplikacji.';
COMMENT ON COLUMN public.marketplace_listings.price_unit IS
  'godzina | dzien | sztuka | usluga | ustalenie';

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_equipment
  ON public.marketplace_listings(equipment_category)
  WHERE equipment_category IS NOT NULL;

-- 2) Storage zdjęć ogłoszeń (max 3 w aplikacji)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'village_marketplace',
  'village_marketplace',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Rynek: publiczny odczyt zdjec" ON storage.objects;
CREATE POLICY "Rynek: publiczny odczyt zdjec"
ON storage.objects FOR SELECT
USING (bucket_id = 'village_marketplace');

DROP POLICY IF EXISTS "Mieszkaniec wgrywa zdjecie rynek" ON storage.objects;
CREATE POLICY "Mieszkaniec wgrywa zdjecie rynek"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'village_marketplace'
  AND split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND public.is_village_resident((split_part(name, '/', 1))::uuid)
);

DROP POLICY IF EXISTS "Wlasciciel usuwa zdjecie rynek" ON storage.objects;
CREATE POLICY "Wlasciciel usuwa zdjecie rynek"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'village_marketplace'
  AND split_part(name, '/', 2) = auth.uid()::text
);

-- 3) Czat
DO $$ BEGIN
  CREATE TYPE public.chat_conversation_kind AS ENUM ('direct', 'group');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.chat_group_preset AS ENUM (
    'mieszkancy',
    'kgw',
    'mysliwi',
    'osp',
    'rada_solecka',
    'wlasna'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  kind public.chat_conversation_kind NOT NULL,
  group_preset public.chat_group_preset,
  title TEXT,
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_group_preset_check CHECK (
    (kind = 'group' AND group_preset IS NOT NULL)
    OR (kind = 'direct' AND group_preset IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_group_preset_per_village
  ON public.chat_conversations(village_id, group_preset)
  WHERE kind = 'group' AND group_preset IS NOT NULL AND group_preset <> 'wlasna';

CREATE INDEX IF NOT EXISTS idx_chat_conversations_village ON public.chat_conversations(village_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_listing ON public.chat_conversations(listing_id);

CREATE TABLE IF NOT EXISTS public.chat_members (
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_members_user ON public.chat_members(user_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_message_body_len CHECK (char_length(trim(body)) BETWEEN 1 AND 4000)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at DESC);

DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) RLS czat
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_chat_member(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members m
    WHERE m.conversation_id = p_conversation_id
      AND m.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_chat_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_chat_member(UUID) TO authenticated;

DROP POLICY IF EXISTS "Czlonkowie widza konwersacje" ON public.chat_conversations;
CREATE POLICY "Czlonkowie widza konwersacje"
ON public.chat_conversations FOR SELECT
USING (public.is_chat_member(id) OR public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Mieszkaniec tworzy konwersacje we wsi" ON public.chat_conversations;
CREATE POLICY "Mieszkaniec tworzy konwersacje we wsi"
ON public.chat_conversations FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND public.is_village_resident(village_id)
);

DROP POLICY IF EXISTS "Admin grupy aktualizuje tytul" ON public.chat_conversations;
CREATE POLICY "Admin grupy aktualizuje tytul"
ON public.chat_conversations FOR UPDATE
USING (
  kind = 'group'
  AND EXISTS (
    SELECT 1 FROM public.chat_members m
    WHERE m.conversation_id = id AND m.user_id = auth.uid() AND m.is_admin = true
  )
);

DROP POLICY IF EXISTS "Czlonkowie widza czlonkostwo" ON public.chat_members;
CREATE POLICY "Czlonkowie widza czlonkostwo"
ON public.chat_members FOR SELECT
USING (public.is_chat_member(conversation_id));

DROP POLICY IF EXISTS "Dolaczenie do konwersacji" ON public.chat_members;
CREATE POLICY "Dolaczenie do konwersacji"
ON public.chat_members FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND public.is_village_resident(c.village_id)
  )
);

DROP POLICY IF EXISTS "Tworca dodaje czlonka do grupy" ON public.chat_members;
CREATE POLICY "Tworca dodaje czlonka do grupy"
ON public.chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    JOIN public.chat_members admin ON admin.conversation_id = c.id
    WHERE c.id = conversation_id
      AND c.kind = 'group'
      AND admin.user_id = auth.uid()
      AND admin.is_admin = true
  )
);

DROP POLICY IF EXISTS "Czlonkowie aktualizuja last_read" ON public.chat_members;
CREATE POLICY "Czlonkowie aktualizuja last_read"
ON public.chat_members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Czlonkowie czytaja wiadomosci" ON public.chat_messages;
CREATE POLICY "Czlonkowie czytaja wiadomosci"
ON public.chat_messages FOR SELECT
USING (public.is_chat_member(conversation_id));

DROP POLICY IF EXISTS "Czlonkowie wysylaja wiadomosci" ON public.chat_messages;
CREATE POLICY "Czlonkowie wysylaja wiadomosci"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_chat_member(conversation_id)
);

-- RPC: konwersacja 1:1 przy ogłoszeniu
CREATE OR REPLACE FUNCTION public.chat_start_listing_conversation(p_listing_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.marketplace_listings%ROWTYPE;
  v_conv UUID;
  v_existing UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_listing FROM public.marketplace_listings WHERE id = p_listing_id;
  IF NOT FOUND OR v_listing.status <> 'approved' THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;
  IF v_listing.owner_user_id = auth.uid() THEN
    RAISE EXCEPTION 'own_listing';
  END IF;
  IF NOT public.is_village_resident(v_listing.village_id) THEN
    RAISE EXCEPTION 'not_resident';
  END IF;

  SELECT c.id INTO v_existing
  FROM public.chat_conversations c
  JOIN public.chat_members m1 ON m1.conversation_id = c.id AND m1.user_id = auth.uid()
  JOIN public.chat_members m2 ON m2.conversation_id = c.id AND m2.user_id = v_listing.owner_user_id
  WHERE c.kind = 'direct'
    AND c.listing_id = p_listing_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.chat_conversations (village_id, kind, listing_id, created_by, title)
  VALUES (
    v_listing.village_id,
    'direct',
    p_listing_id,
    auth.uid(),
    left('Ogłoszenie: ' || v_listing.title, 120)
  )
  RETURNING id INTO v_conv;

  INSERT INTO public.chat_members (conversation_id, user_id, is_admin) VALUES
    (v_conv, auth.uid(), true),
    (v_conv, v_listing.owner_user_id, false);

  RETURN v_conv;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_start_listing_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_start_listing_conversation(UUID) TO authenticated;

-- RPC: grupa preset (jedna na wieś)
CREATE OR REPLACE FUNCTION public.chat_get_or_create_preset_group(
  p_village_id UUID,
  p_preset public.chat_group_preset
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv UUID;
  v_title TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF NOT public.is_village_resident(p_village_id) THEN
    RAISE EXCEPTION 'not_resident';
  END IF;
  IF p_preset = 'wlasna' THEN
    RAISE EXCEPTION 'use_custom_group';
  END IF;

  SELECT id INTO v_conv
  FROM public.chat_conversations
  WHERE village_id = p_village_id AND group_preset = p_preset
  LIMIT 1;

  IF v_conv IS NULL THEN
    v_title := CASE p_preset
      WHEN 'mieszkancy' THEN 'Mieszkańcy wsi'
      WHEN 'kgw' THEN 'KGW'
      WHEN 'mysliwi' THEN 'Koło myśliwskie'
      WHEN 'osp' THEN 'OSP'
      WHEN 'rada_solecka' THEN 'Rada sołecka'
      ELSE 'Grupa'
    END;
    INSERT INTO public.chat_conversations (village_id, kind, group_preset, title, created_by)
    VALUES (p_village_id, 'group', p_preset, v_title, auth.uid())
    RETURNING id INTO v_conv;
  END IF;

  INSERT INTO public.chat_members (conversation_id, user_id, is_admin)
  VALUES (v_conv, auth.uid(), false)
  ON CONFLICT DO NOTHING;

  RETURN v_conv;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_get_or_create_preset_group(UUID, public.chat_group_preset) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_get_or_create_preset_group(UUID, public.chat_group_preset) TO authenticated;
