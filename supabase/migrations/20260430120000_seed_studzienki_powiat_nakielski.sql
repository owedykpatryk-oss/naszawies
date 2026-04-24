-- Studzienki (gmina Kcynia, powiat nakielski): rekord wsi + świetlica z danymi kontaktowymi z BIP gminy (kcynia.pl/solectwa).
-- Pełna lista miejscowości w powiecie: node scripts/import-teryt-powiat.mjs 04 10 TERC.xml SIMC.xml (patrz skrypt).

INSERT INTO public.villages (
  teryt_id,
  name,
  slug,
  voivodeship,
  county,
  commune,
  commune_type,
  latitude,
  longitude,
  population,
  description,
  website,
  is_active
)
VALUES (
  '0088390',
  'Studzienki',
  'studzienki',
  'kujawsko-pomorskie',
  'nakielski',
  'Kcynia',
  'gmina_miejsko_wiejska',
  53.0675000,
  17.5588890,
  272,
  'Sołectwo w gminie Kcynia (powiat nakielski, woj. kujawsko-pomorskie). Sołtys: Tadeusz Owedyk — adres korespondencyjny sołectwa: ul. Leśna 2, 89-240 Studzienki. Świetlica wiejska: ul. Leśna 17. Kontakt sołectwa: studzienki@kcynia.pl, tel. 666 071 399. Źródło danych kontaktowych sołtysa: strona „Sołectwa i osiedla” Urzędu Miasta i Gminy Kcynia (kcynia.pl).',
  'https://kcynia.pl',
  true
)
ON CONFLICT (teryt_id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  voivodeship = EXCLUDED.voivodeship,
  county = EXCLUDED.county,
  commune = EXCLUDED.commune,
  commune_type = EXCLUDED.commune_type,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  population = EXCLUDED.population,
  description = EXCLUDED.description,
  website = EXCLUDED.website,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO public.halls (
  village_id,
  name,
  description,
  address,
  max_capacity,
  contact_phone,
  contact_email,
  caretaker_name
)
SELECT
  v.id,
  'Świetlica wiejska w Studzienkach',
  'Świetlica sołecka (obiekt przy ul. Leśnej 17) — rezerwacje i dokument wynajmu w panelu naszawies.pl. Sprawy sołeckie i korespondencja sołtysa: ul. Leśna 2.',
  'ul. Leśna 17, 89-240 Studzienki',
  80,
  '+48666071399',
  'studzienki@kcynia.pl',
  'Tadeusz Owedyk (sołtys sołectwa Studzienki)'
FROM public.villages v
WHERE v.teryt_id = '0088390'
  AND NOT EXISTS (
    SELECT 1
    FROM public.halls h
    WHERE h.village_id = v.id
      AND h.name = 'Świetlica wiejska w Studzienkach'
  );
