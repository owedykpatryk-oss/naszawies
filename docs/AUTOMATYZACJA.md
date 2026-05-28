# Automatyzacja naszawies.pl

## Cron (Vercel)

W `vercel.json`:

| Harmonogram | Endpoint | Co robi |
|-------------|----------|---------|
| co 4 h | `/api/automatyzacje/run` | POI z OSM, **POI z Geoportalu** (OSP/policja/PRNG), granice PRG, adresy KIN, kontekst WFS, PKP, autobusy, jakość mapy, RPC wsi |
| co 2 h | `/api/mapa/sync-granice` | Kolejka granic PRG (większy limit dla mapy) |
| co 6 h | `/api/kanaly-rss/sync` | Kanały RSS |

Autoryzacja: nagłówek `Authorization: Bearer <CRON_SECRET>`.

## Mapa — co jest automatyczne

### Bez kluczy API (domyślnie włączone w cronie)

- **Obrys wsi** — `boundary_geojson` z WFS PRG (Geoportal).
- **Punkty POI** — szkoła, kościół, sklep, **przystanek**, **stacja kolejowa**, OSP itd. z OpenStreetMap (Overpass), limity `POI_AUTO_SYNC_*`.
- **Adresy** — punkty adresowe PRG (`address_points`).
- **Kontekst Geoportal** — warstwy pomocnicze (nie zawsze widoczne jako pinezki).
- **Alerty jakości** — np. brak POI / brak adresów.

### Transport (wymaga konfiguracji `.env`)

| Źródło | Zmienne | Efekt na mapie |
|--------|---------|----------------|
| **PKP** | `TRANSPORT_SYNC_ENABLED=1`, `PKP_PLK_API_KEY` | Cache odjazdów; popup stacji na mapie; status opóźnień |
| **Autobusy GTFS** | `TRANSPORT_BUS_SYNC_ENABLED=1`, `TRANSPORT_GTFS_ZIP_URL` (lub osobne CSV) | Cache odjazdów; **auto-tworzenie POI „przystanek”**; **odjazdy w popupie mapy** (`/api/mapa/poi/…/odjazdy`) |
| **e-podróżnik** | `TRANSPORT_EPODROZNIK_ENABLED=1`, `EPODROZNIK_API_KEY` | Odjazdy bez auto-pinezki (brak współrzędnych w API) |

Przepływ autobusów:

1. Cron lub sołtys → sync GTFS w promieniu wsi.
2. Jeśli brak pinezki w ~120 m → insert POI `przystanek`.
3. Odjazdy w `bus_departures_cache` z `poi_id` (dopasowanie nazwy + odległości).

PKP: potrzebna pinezka `stacja_kolejowa` (OSM lub ręcznie) + opcjonalnie mapowanie w `/panel/soltys/transport`.

## Mapa publiczna (`/mapa`)

- **Automatyzacja w tle** (wymaga `SUPABASE_SERVICE_ROLE_KEY`): gdy wiele wsi bez obrysu lub bez transportu — sync granic PRG, OSM POI, PKP (w tym hub powiatowy bez pinezki), autobusy GTFS.
- **Filtry warstw**: transport, polowania, zgłoszenia, rynek — zapis w URL (`?warstwa=transport`).
- **Popup odjazdów** na przystanku/stacji PKP.
- **Pasek statystyk** nad mapą.

## Sugestywny panel sołtysa

Na **Profil wsi** (`/panel/soltys/moja-wies`) blok **„Sugestie mapy”**:

- brak obrysu / przystanków / stacji,
- przycisk **Uzupełnij z OSM**,
- **Odśwież PKP i autobusy**,
- link do panelu transportu.

Mapa publiczna: przy wejściu, jeśli wiele wsi bez granicy, tło sync PRG (`mapa-sync-granice-klient`).

## Źródła otwarte (dane.gov.pl + Geoportal)

Szczegóły: **[ZRODLA_OTWARTE.md](./ZRODLA_OTWARTE.md)** — co jest wdrożone (PRG, KIN, PRNG, OSM), co warto z katalogu dane.gov.pl (TERYT, REGON, GDDKiA), oraz ortofotomapa WMS.

## Co można dodać później (pomysły)

- Propozycje mieszkańców → kolejka POI do zatwierdzenia przez sołtysa.
- Warstwy mapy (włącz/wyłącz przystanki, polowania, ładne miejsca).
- PKS rozkład z innych GTFS regionalnych (osobne URL per województwo).
- Powiadomienia push przy opóźnieniu PKP (częściowo jest w sync transportu).
- Import zdjęć ładnych miejsc z Wikimedia po współrzędnych.

## Szybki start administratora

```env
CRON_SECRET=...
TRANSPORT_SYNC_ENABLED=1
PKP_PLK_API_KEY=...
TRANSPORT_BUS_SYNC_ENABLED=1
TRANSPORT_GTFS_ZIP_URL=https://mkuran.pl/gtfs/lublin.zip
# lub TRANSPORT_GTFS_STOPS_URL + TRANSPORT_GTFS_STOP_TIMES_URL
TRANSPORT_AUTO_CREATE_STOP_POI=1
```

Po deploy: Vercel Cron + `supabase db push` dla migracji.
