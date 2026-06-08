-- Rozszerzenie rodzajów ostrzeżeń leśnych (prace zmechanizowane, niebezpieczne drzewo, burza)

ALTER TABLE public.village_forestry_notices
  DROP CONSTRAINT IF EXISTS village_forestry_notices_notice_kind_check;

ALTER TABLE public.village_forestry_notices
  ADD CONSTRAINT village_forestry_notices_notice_kind_check
  CHECK (notice_kind IN (
    'zakaz_wejscia',
    'wycinka',
    'prace_zmechanizowane',
    'niebezpieczne_drzewo',
    'pozar_lasu',
    'silny_wiatr',
    'burza',
    'zbieractwo',
    'droga_zamknieta',
    'inne'
  ));
