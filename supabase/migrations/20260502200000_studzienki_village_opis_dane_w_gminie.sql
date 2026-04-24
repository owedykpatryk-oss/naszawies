-- Studzienki: opis profilu wsi bez numeru telefonu i szczegółowych adresów w serwisie
-- (dane oficjalne: BIP / Urząd Gminy Kcynia).

UPDATE villages
SET description =
  'Sołectwo w gminie Kcynia (powiat nakielski, woj. kujawsko-pomorskie). Sołtys: Tadeusz Owedyk. Pełne dane kontaktowe, adresy do korespondencji i informacje urzędowe publikuje Urząd Miasta i Gminy Kcynia — strona kcynia.pl i BIP (także wykaz sołectw). W naszawies.pl: profil wsi, materiały projektu i rezerwacje obiektów po zalogowaniu.'
WHERE teryt_id = '0088390';

-- Świetlica: kierunek na stronę gminy, bez ulicy w tym opisie
UPDATE halls
SET description =
  'Świetlica sołecka — rezerwacje i dokument wynajmu w panelu naszawies.pl. Aktualne adresy, korespondencję do sołectwa i dane kontaktowe oficjalnie publikuje Urząd Gminy Kcynia (kcynia.pl / BIP).'
WHERE village_id = (SELECT id FROM villages WHERE teryt_id = '0088390' LIMIT 1);
