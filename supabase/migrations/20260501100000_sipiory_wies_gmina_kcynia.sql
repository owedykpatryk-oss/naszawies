-- Sipiory — wieś w gminie Kcynia (powiat nakielski), obok m.in. Studzienek. SIMC: 0088354 (GUS TERYT).
-- W katalogu był tylko seed Studzienek; pełna lista miejscowości: import TERYT dla powiatu (patrz import-teryt-powiat.mjs).
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
  '0088354',
  'Sipiory',
  'sipiory',
  'kujawsko-pomorskie',
  'nakielski',
  'Kcynia',
  'gmina_miejsko_wiejska',
  53.0727780,
  17.5097220,
  82,
  'Wieś w gminie Kcynia (powiat nakielski, woj. kujawsko-pomorskie). Sąsiednie sołectwa w serwisie: m.in. Studzienki.',
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
