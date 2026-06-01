-- Fala C: własne pola formularza rezerwacji świetlicy

ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS booking_form_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.hall_bookings
  ADD COLUMN IF NOT EXISTS custom_answers JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.halls.booking_form_fields IS
  'Definicje dodatkowych pól w formularzu rezerwacji (sołtys konfiguruje w panelu świetlicy).';

COMMENT ON COLUMN public.hall_bookings.custom_answers IS
  'Odpowiedzi mieszkańca na pola niestandardowe (klucz = id pola).';
