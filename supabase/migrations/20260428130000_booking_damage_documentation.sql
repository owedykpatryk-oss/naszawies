-- Zdjęcia dokumentujące zniszczenia po wydarzeniu (rezerwacja świetlicy)
ALTER TABLE public.hall_bookings
  ADD COLUMN IF NOT EXISTS damage_documentation_urls TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.hall_bookings.damage_documentation_urls IS
  'Publiczne URL-e ze Storage (hall_booking_damage), max. zalecane w aplikacji 12. Opis sytuacji: completion_notes / was_damaged.';

-- Wynajmujący może uzupełnić dokumentację po zatwierdzonej rezerwacji
DROP POLICY IF EXISTS "Booker updates damage documentation on own booking" ON public.hall_bookings;
CREATE POLICY "Booker updates damage documentation on own booking"
ON public.hall_bookings FOR UPDATE
TO authenticated
USING (
  booked_by = auth.uid()
  AND status IN ('approved', 'completed')
)
WITH CHECK (
  booked_by = auth.uid()
  AND status IN ('approved', 'completed')
);

-- Bucket: ścieżka {booking_id}/{losowa_nazwa}.ext
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hall_booking_damage',
  'hall_booking_damage',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Zniszczenia publiczny odczyt" ON storage.objects;
CREATE POLICY "Zniszczenia publiczny odczyt"
ON storage.objects FOR SELECT
USING (bucket_id = 'hall_booking_damage');

DROP POLICY IF EXISTS "Wgrywanie zdjęć zniszczeń do rezerwacji" ON storage.objects;
CREATE POLICY "Wgrywanie zdjęć zniszczeń do rezerwacji"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hall_booking_damage'
  AND EXISTS (
    SELECT 1
    FROM public.hall_bookings b
    INNER JOIN public.halls h ON h.id = b.hall_id
    WHERE b.id = split_part(name, '/', 1)::uuid
      AND (
        b.booked_by = auth.uid()
        OR public.is_village_soltys(h.village_id)
      )
      AND b.status IN ('approved', 'completed')
  )
);

DROP POLICY IF EXISTS "Aktualizacja plików zniszczeń rezerwacji" ON storage.objects;
CREATE POLICY "Aktualizacja plików zniszczeń rezerwacji"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hall_booking_damage'
  AND EXISTS (
    SELECT 1
    FROM public.hall_bookings b
    INNER JOIN public.halls h ON h.id = b.hall_id
    WHERE b.id = split_part(name, '/', 1)::uuid
      AND (
        b.booked_by = auth.uid()
        OR public.is_village_soltys(h.village_id)
      )
  )
)
WITH CHECK (
  bucket_id = 'hall_booking_damage'
  AND EXISTS (
    SELECT 1
    FROM public.hall_bookings b
    INNER JOIN public.halls h ON h.id = b.hall_id
    WHERE b.id = split_part(name, '/', 1)::uuid
      AND (
        b.booked_by = auth.uid()
        OR public.is_village_soltys(h.village_id)
      )
  )
);

DROP POLICY IF EXISTS "Usuwanie plików zniszczeń rezerwacji" ON storage.objects;
CREATE POLICY "Usuwanie plików zniszczeń rezerwacji"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'hall_booking_damage'
  AND EXISTS (
    SELECT 1
    FROM public.hall_bookings b
    INNER JOIN public.halls h ON h.id = b.hall_id
    WHERE b.id = split_part(name, '/', 1)::uuid
      AND (
        b.booked_by = auth.uid()
        OR public.is_village_soltys(h.village_id)
      )
  )
);
