-- Korekta: świetlica — ul. Leśna 17; sołtys / korespondencja sołectwa — ul. Leśna 2 (BIP gminy Kcynia).

UPDATE public.villages
SET
  description = 'Sołectwo w gminie Kcynia (powiat nakielski, woj. kujawsko-pomorskie). Sołtys: Tadeusz Owedyk — adres korespondencyjny sołectwa: ul. Leśna 2, 89-240 Studzienki. Świetlica wiejska: ul. Leśna 17. Kontakt sołectwa: studzienki@kcynia.pl, tel. 666 071 399. Źródło danych kontaktowych sołtysa: strona „Sołectwa i osiedla” Urzędu Miasta i Gminy Kcynia (kcynia.pl).',
  updated_at = NOW()
WHERE teryt_id = '0088390';

UPDATE public.halls h
SET
  address = 'ul. Leśna 17, 89-240 Studzienki',
  description = 'Świetlica sołecka (obiekt przy ul. Leśnej 17) — rezerwacje i dokument wynajmu w panelu naszawies.pl. Sprawy sołeckie i korespondencja sołtysa: ul. Leśna 2.',
  updated_at = NOW()
FROM public.villages v
WHERE h.village_id = v.id
  AND v.teryt_id = '0088390'
  AND h.name = 'Świetlica wiejska w Studzienkach';
