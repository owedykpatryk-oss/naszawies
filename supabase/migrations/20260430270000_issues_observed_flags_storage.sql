-- Zgłoszenia problemów: kiedy zauważono, szybkie oznaczenia (JSON), zdjęcia w Storage.

ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS observed_at timestamptz,
  ADD COLUMN IF NOT EXISTS quick_flags jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.issues.observed_at IS
  'Opcjonalna data i godzina zauważenia problemu (inna niż created_at).';
COMMENT ON COLUMN public.issues.quick_flags IS
  'Niewielki zestaw szybkich pól: np. { "bliskosc_szkoly": true } — tylko zdefiniowane w aplikacji.';

-- Bucket: {village_id}/{user_id}/{nazwa_pliku} — tylko mieszkaniec danej wsi wgłasnej ścieżce.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'village_issues',
  'village_issues',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Nazwy polityk ASCII — te same co na zdalnej bazie (MCP) dla idempotentności
DROP POLICY IF EXISTS "Zgloszenia wsi: publiczny odczyt zdjec" ON storage.objects;
CREATE POLICY "Zgloszenia wsi: publiczny odczyt zdjec"
ON storage.objects FOR SELECT
USING (bucket_id = 'village_issues');

DROP POLICY IF EXISTS "Mieszkaniec wgrywa zdjecie do zgloszenia" ON storage.objects;
CREATE POLICY "Mieszkaniec wgrywa zdjecie do zgloszenia"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'village_issues'
  AND split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND public.is_village_resident((split_part(name, '/', 1))::uuid)
);

DROP POLICY IF EXISTS "Mieszkaniec usuwa swoje zdjecie zgloszenia" ON storage.objects;
CREATE POLICY "Mieszkaniec usuwa swoje zdjecie zgloszenia"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'village_issues'
  AND split_part(name, '/', 2) = auth.uid()::text
);

DROP POLICY IF EXISTS "Soltys moze usuwac zdjecia w swojej wsi" ON storage.objects;
CREATE POLICY "Soltys moze usuwac zdjecia w swojej wsi"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'village_issues'
  AND public.is_village_soltys((split_part(name, '/', 1))::uuid)
);
