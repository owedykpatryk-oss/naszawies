-- Jeśli wieś Studzienki jest w bazie, ale świetlica nie powstała (np. samodzielny UPDATE z 301230), dołóż salę.

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
