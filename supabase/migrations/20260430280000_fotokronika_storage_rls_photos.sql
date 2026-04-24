-- Fotokronika: zdjecia w Storage, wgranie tylko od mieszkanca wsi; moderacja: sołtys.

-- 1) Scislejsze INSERT: tylko mieszkaniec wsi; album (jesli podany) musi nalezec do tej samej wsi
DROP POLICY IF EXISTS "Authenticated users upload photos" ON public.photos;
CREATE POLICY "Mieszkancy wsi wgraja zdjecia do moderacji"
ON public.photos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND uploaded_by = auth.uid()
  AND status = 'pending'
  AND public.is_village_resident(village_id)
  AND (
    album_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.photo_albums a
      WHERE a.id = album_id
        AND a.village_id = photos.village_id
    )
  )
);

-- 2) Uploader moze usunac wlasne oczekujace (pomyłka w wyborze pliku)
CREATE POLICY "Uzytkownik usuwa wlasne zdjecie w statusie pending"
ON public.photos
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid() AND status = 'pending');

-- 3) Bucket: village_photos / {village_id}/{user_id}/...
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'village_photos',
  'village_photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Fotokronika wsi odczyt" ON storage.objects;
CREATE POLICY "Fotokronika wsi odczyt"
ON storage.objects FOR SELECT
USING (bucket_id = 'village_photos');

DROP POLICY IF EXISTS "Fotokronika wsi wgraj mieszkaniec" ON storage.objects;
CREATE POLICY "Fotokronika wsi wgraj mieszkaniec"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'village_photos'
  AND split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND public.is_village_resident((split_part(name, '/', 1))::uuid)
);

DROP POLICY IF EXISTS "Fotokronika wsi usun wlasne" ON storage.objects;
CREATE POLICY "Fotokronika wsi usun wlasne"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'village_photos'
  AND split_part(name, '/', 2) = auth.uid()::text
);

DROP POLICY IF EXISTS "Fotokronika wsi usun soltys" ON storage.objects;
CREATE POLICY "Fotokronika wsi usun soltys"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'village_photos'
  AND public.is_village_soltys((split_part(name, '/', 1))::uuid)
);
