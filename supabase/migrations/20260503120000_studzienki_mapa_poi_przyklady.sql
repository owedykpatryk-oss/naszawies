-- Przykładowe POI na mapie globalnej (Studzienki) — tylko gdy wsi jeszcze brak punktów w `pois`.
-- Sołtys może później doprecyzować współrzędne / usunąć tę wstępną wersję.

INSERT INTO public.pois (village_id, category, name, description, latitude, longitude)
SELECT
  v.id,
  t.cat,
  t.nazwa,
  t.opis,
  (v.latitude::numeric + t.dlat)::numeric(10, 7),
  (v.longitude::numeric + t.dlon)::numeric(10, 7)
FROM public.villages v
CROSS JOIN (
  VALUES
    (
      'swietlica',
      'Świetlica sołecka',
      'Orientacja na mapie (rezerwacje w serwisie) — współrzędne można doprecyzować.',
      0.001,
      0.0003
    ),
    (
      'kosciol',
      'Kościół',
      'Przykładowa lokalizacja w sołectwie (do weryfikacji).',
      0.0018,
      -0.0004
    ),
    (
      'szkola',
      'Szkoła / placówka oświaty',
      'Gdy w sołectwie obowiązuje inna lokalizacja — zaktualizuj punkt w danych.',
      -0.0007,
      0.0011
    ),
    (
      'soltys',
      'Kontakt sołecki',
      'Punkt orientacyjny — biegły adres: urząd gminy / BIP (patrz strona wsi).',
      0.0002,
      0.0001
    )
) AS t(cat, nazwa, opis, dlat, dlon)
WHERE v.teryt_id = '0088390'
  AND v.latitude IS NOT NULL
  AND v.longitude IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.pois p WHERE p.village_id = v.id);
