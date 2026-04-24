-- Telefon: jawna zgoda na pokazanie na publicznym profilu
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_visible_public BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.phone_visible_public IS 'RODO: jeśli true, numer telefonu może być widoczny na /u/[id].';

-- Buckety Storage (awatary — publiczny odczyt, zapis tylko do własnego folderu)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Polityki storage.objects (RLS na storage jest domyślnie włączone w Supabase)
DROP POLICY IF EXISTS "Awatary publiczny odczyt" ON storage.objects;
CREATE POLICY "Awatary publiczny odczyt"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Awatary upload własny folder" ON storage.objects;
CREATE POLICY "Awatary upload własny folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

DROP POLICY IF EXISTS "Awatary update własny folder" ON storage.objects;
CREATE POLICY "Awatary update własny folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);

DROP POLICY IF EXISTS "Awatary delete własny folder" ON storage.objects;
CREATE POLICY "Awatary delete własny folder"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);

-- Tylko wniosek o rolę mieszkańca (nie samodzielny wniosek sołtysa przez ten kanał)
DROP POLICY IF EXISTS "Users create own role applications" ON public.user_village_roles;
CREATE POLICY "Users create own role applications"
ON public.user_village_roles FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND role = 'mieszkaniec'
);

-- Sołtys może dodać powiadomienie dla mieszkańca w swojej wsi (np. po akceptacji)
DROP POLICY IF EXISTS "Soltys inserts village notifications" ON public.notifications;
CREATE POLICY "Soltys inserts village notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  related_type = 'village'
  AND related_id IS NOT NULL
  AND is_village_soltys(related_id)
  AND EXISTS (
    SELECT 1 FROM public.user_village_roles u
    WHERE u.user_id = user_id
      AND u.village_id = related_id
  )
);
