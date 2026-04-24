-- Plan sali w Studzienkach: ten sam szkic co `UKLAD_STOLOW_W_SALI_STUDZIENKI` (rzut PNG) zmapowany do `layout_data` (edytor 100×70).
-- Źródło logiczne: `src/lib/swietlica/plan-sali-studzienki-seed.ts` — po zmianie układu odtwórz JSON i zaktualizuj migrację lub wykonaj UPDATE ręcznie.

UPDATE public.halls h
SET
  layout_data = '{
    "wersja": 1,
    "szerokosc_sali_m": 5.85,
    "dlugosc_sali_m": 12.4,
    "elementy": [
      {
        "id": "6f2c8a10-1a3b-4b6d-8e1f-000000000001",
        "typ": "stol_prostokatny",
        "x": 8.82,
        "y": 9.72,
        "szer": 35.29,
        "wys": 4.38,
        "obrot": 0,
        "etykieta": "1",
        "miejsca": 6,
        "szer_cm": 180,
        "dl_cm": 80
      },
      {
        "id": "6f2c8a10-1a3b-4b6d-8e1f-000000000002",
        "typ": "stol_prostokatny",
        "x": 8.82,
        "y": 21.39,
        "szer": 35.29,
        "wys": 4.38,
        "obrot": 0,
        "etykieta": "2",
        "miejsca": 6,
        "szer_cm": 180,
        "dl_cm": 80
      },
      {
        "id": "6f2c8a10-1a3b-4b6d-8e1f-000000000003",
        "typ": "stol_prostokatny",
        "x": 8.82,
        "y": 33.06,
        "szer": 35.29,
        "wys": 4.38,
        "obrot": 0,
        "etykieta": "3",
        "miejsca": 6,
        "szer_cm": 180,
        "dl_cm": 80
      },
      {
        "id": "6f2c8a10-1a3b-4b6d-8e1f-000000000004",
        "typ": "stol_okragly",
        "x": 47.06,
        "y": 19.44,
        "szer": 20.59,
        "wys": 6.81,
        "obrot": 0,
        "etykieta": "4",
        "miejsca": 8,
        "szer_cm": 120,
        "dl_cm": 120
      },
      {
        "id": "6f2c8a10-1a3b-4b6d-8e1f-000000000005",
        "typ": "stol_okragly",
        "x": 47.06,
        "y": 33.06,
        "szer": 20.59,
        "wys": 6.81,
        "obrot": 0,
        "etykieta": "5",
        "miejsca": 8,
        "szer_cm": 120,
        "dl_cm": 120
      },
      {
        "id": "6f2c8a10-1a3b-4b6d-8e1f-000000000006",
        "typ": "stol_okragly",
        "x": 47.06,
        "y": 46.67,
        "szer": 20.59,
        "wys": 6.81,
        "obrot": 0,
        "etykieta": "6",
        "miejsca": 8,
        "szer_cm": 120,
        "dl_cm": 120
      }
    ]
  }'::jsonb,
  updated_at = NOW()
FROM public.villages v
WHERE h.village_id = v.id
  AND v.teryt_id = '0088390'
  AND h.name = 'Świetlica wiejska w Studzienkach';
