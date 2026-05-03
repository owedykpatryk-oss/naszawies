-- Studzienki (TERYT 0088390): usuń POI z migracji demo `20260503120000_studzienki_mapa_poi_przyklady.sql`.
-- Na mapie pokazywały szkołę / kościół itd. mimo że w sołectwie to były tylko sztuczne offsety od punktu wsi.

DELETE FROM public.pois p
USING public.villages v
WHERE p.village_id = v.id
  AND v.teryt_id = '0088390'
  AND (
    p.description = 'Orientacja na mapie (rezerwacje w serwisie) — współrzędne można doprecyzować.'
    OR p.description = 'Przykładowa lokalizacja w sołectwie (do weryfikacji).'
    OR p.description = 'Gdy w sołectwie obowiązuje inna lokalizacja — zaktualizuj punkt w danych.'
    OR p.description = 'Punkt orientacyjny — biegły adres: urząd gminy / BIP (patrz strona wsi).'
  );
