-- Regulamin jako plik (PDF/obraz), protokół odbioru sali po wydarzeniu

ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS rules_file_name TEXT;

COMMENT ON COLUMN public.halls.rules_file_url IS
  'Publiczny URL pliku regulaminu (PDF, JPEG, PNG, WebP) — uchwała skan lub oficjalny dokument.';
COMMENT ON COLUMN public.halls.rules_file_name IS
  'Oryginalna nazwa pliku regulaminu do wyświetlenia w panelu i dokumencie.';

ALTER TABLE public.hall_bookings
  ADD COLUMN IF NOT EXISTS checkout_inspection JSONB;

COMMENT ON COLUMN public.hall_bookings.checkout_inspection IS
  'Protokół odbioru sali: stan sali, weryfikacja asortymentu, uwagi, decyzja o kaucji. Uzupełnia status completed.';

-- Bucket na pliki regulaminu (fallback Supabase Storage gdy brak R2)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hall_rules',
  'hall_rules',
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read hall rules" ON storage.objects;
CREATE POLICY "Public read hall rules"
ON storage.objects FOR SELECT
USING (bucket_id = 'hall_rules');

DROP POLICY IF EXISTS "Soltys upload hall rules" ON storage.objects;
CREATE POLICY "Soltys upload hall rules"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hall_rules'
  AND EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = split_part(name, '/', 1)::uuid
      AND public.is_village_soltys(h.village_id)
  )
);

DROP POLICY IF EXISTS "Soltys update hall rules" ON storage.objects;
CREATE POLICY "Soltys update hall rules"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hall_rules'
  AND EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = split_part(name, '/', 1)::uuid
      AND public.is_village_soltys(h.village_id)
  )
)
WITH CHECK (
  bucket_id = 'hall_rules'
  AND EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = split_part(name, '/', 1)::uuid
      AND public.is_village_soltys(h.village_id)
  )
);

DROP POLICY IF EXISTS "Soltys delete hall rules" ON storage.objects;
CREATE POLICY "Soltys delete hall rules"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'hall_rules'
  AND EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.id = split_part(name, '/', 1)::uuid
      AND public.is_village_soltys(h.village_id)
  )
);
