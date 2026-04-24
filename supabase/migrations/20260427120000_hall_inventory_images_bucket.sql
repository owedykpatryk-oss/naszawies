-- Zdjęcia pozycji asortymentu świetlicy (hall_inventory.image_url)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hall_inventory',
  'hall_inventory',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Asortyment publiczny odczyt" ON storage.objects;
CREATE POLICY "Asortyment publiczny odczyt"
ON storage.objects FOR SELECT
USING (bucket_id = 'hall_inventory');

DROP POLICY IF EXISTS "Sołtys wgrywa zdjęcia asortymentu sali" ON storage.objects;
CREATE POLICY "Sołtys wgrywa zdjęcia asortymentu sali"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hall_inventory'
  AND EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = split_part(name, '/', 1)::uuid
      AND public.is_village_soltys(h.village_id)
  )
);

DROP POLICY IF EXISTS "Sołtys aktualizuje zdjęcia asortymentu sali" ON storage.objects;
CREATE POLICY "Sołtys aktualizuje zdjęcia asortymentu sali"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hall_inventory'
  AND EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = split_part(name, '/', 1)::uuid
      AND public.is_village_soltys(h.village_id)
  )
)
WITH CHECK (
  bucket_id = 'hall_inventory'
  AND EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = split_part(name, '/', 1)::uuid
      AND public.is_village_soltys(h.village_id)
  )
);

DROP POLICY IF EXISTS "Sołtys usuwa zdjęcia asortymentu sali" ON storage.objects;
CREATE POLICY "Sołtys usuwa zdjęcia asortymentu sali"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'hall_inventory'
  AND EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = split_part(name, '/', 1)::uuid
      AND public.is_village_soltys(h.village_id)
  )
);
