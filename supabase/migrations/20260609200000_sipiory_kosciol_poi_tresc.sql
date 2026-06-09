-- Profil POI: Kościół pw. św. Jana Nepomucena w Sipiorach (treść z tablicy informacyjnej)

UPDATE public.pois
SET
  name = 'Kościół pw. Świętego Jana Nepomucena',
  description = 'Parafia rzymskokatolicka pw. św. Jana Nepomucena w Sipiorach (gmina Kcynia). Neogotycki kościół z lat 1932–1933, konsekrowany w 1934 r. przez kard. Augusta Hlonda — serce modlitwy i pamięci lokalnej społeczności.',
  story_text = E'Parafia rzymskokatolicka pw. **św. Jana Nepomucena** w Sipiorach — ważne miejsce kultu i pamięci dla mieszkańców gminy Kcynia. Świątynia powstała dzięki zaangażowaniu parafian, którzy po odzyskaniu niepodległości wreszcie mogli wznieść własny kościół.\n\n**1902** — Rodzina Busse (protestanccy właściciele majątku sipiorskiego) przekazuje 30 000 marek na budowę, lecz władze pruskie odmawiają zgody na katolicką świątynię.\n\n**Po 1920** — Plany budowy wracają na właściwe tory. Wojciech Wierzman daruje centralną działkę (ok. 8 morgów) pod kościół.\n\n**1932** — Po żniwach rozpoczyna się budowa, finansowana i wykonywana przez parafian oraz lokalne firmy.\n\n**20 sierpnia 1933** — Poświęcenie kościoła i pierwsza msza.\n\n**6 września 1934** — Uroczysta konsekracja dokonana przez **kardynała Augusta Hlonda**.\n\n**Krótko po konsekracji** — W wieżę uderza piorun; uszkodzenia szybko usunięto.\n\n**1939–1945** — Kościół zamknięty dla kultu (warsztat), dzwony rekwirowane w 1943 r., wycinka drzew wokół świątyni.\n\n**1951** — Nowy ołtarz główny Ignacego Perackiego (Kcynia) z obrazem patrona autorstwa Tomasza Królikiewicza.\n\n*„Niech ten dom Boży będzie miejscem modlitwy, pokoju i jedności kolejnych pokoleń.”* — Mieszkańcy Sipior',
  facts_text = E'**Św. Jan Nepomucen** — patron ochrony przed powodziami i wodą, mostów, tajemnicy spowiedzi oraz przed oszczerstwami. W ikonografii często z pięcioma gwiazdkami wokół głowy (cud po męczeństwie w Wełtawie).\n\n**Parafia w skrócie**\n- Diecezja bydgoska, dekanat Kcynia\n- Parafia ustanowiona: **1934**\n- Odpust parafialny: **21 maja**\n- Wieczysta adoracja: **17 lipca**\n- Msze niedzielne: **8:00**, **11:00** (w Kowalewku **9:30**)\n- Proboszcz: ks. Andrzej Białczyk\n\n**Obszar parafii (sołectwa)**\nSipiory, Gromadno, Józefkowo, Kowalewko, Kowalewko-Folwark, Ludwikowo, Paulina, Piotrowo, Studzienki, Weronika.\n\n**Ciekawostki architektoniczne**\n- **Organy** — instrument **Wilhelma Sauera** (opus 592), o ok. 40 lat starszy od kościoła; po wojnie przeniesiony z innej świątyni i skrócony pod niższe sklepienie.\n- **Dzwony** — pierwotnie trzy, odlane w Poznaniu: Antoni (150 kg), Józef (100 kg), Jan Nepomucen (45 kg).\n- **Koszt budowy** ok. **128 000 zł** — głównie fundusze i praca mieszkańców.\n- Posągi patrona tradycyjnie przy wodzie — w Sipiorach Jan Nepomucen ma chronić wieś przed powodziami.',
  photo_url = 'https://fotopolska.eu/zdjecie,2850185,1300,250.jpg',
  photo_caption = 'Kościół w Sipiorach ok. 1933 r., po poświęceniu 20 VIII 1933 — Kujawsko-Pomorska Biblioteka Cyfrowa (Public Domain), fotopolska.eu',
  opening_hours = '[
    {"day": "Niedziela", "hours": "Msze św. 8:00, 11:00"},
    {"day": "Kowalewko", "hours": "Msza św. 9:30"},
    {"day": "Odpust parafialny", "hours": "21 maja"},
    {"day": "Adoracja", "hours": "17 lipca"}
  ]'::jsonb,
  gallery_photos = '[
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "url": "https://fotopolska.eu/zdjecie,2850185,1300,250.jpg",
      "etykieta": "Kościół ok. 1933 r. — dzień poświęcenia"
    }
  ]'::jsonb,
  source = 'local_corrected',
  verified_at = now(),
  is_local_override = true
WHERE id = '84465c03-2497-4d24-b466-03ead44cbf04';
