# Zmienne środowiskowe na Vercel

Skopiuj z lokalnego `.env.local` (Production + Preview). Wymagane do crona i mapy:

| Zmienna | Opis |
|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Klucz anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron, automatyzacje, RSS |
| `CRON_SECRET` | Bearer dla `/api/automatyzacje/run` (jak w `vercel.json`) |
| `PKP_PLK_API_KEY` | Rozkłady PKP (jeśli transport włączony) |
| `TRANSPORT_*`, `TRANSPORT_GTFS_ZIP_URL` | GTFS / autobusy |

Geoportal (adresy KIN, PRNG, instytucje PRG, POI z kontekstu):

- `GEOPORTAL_ADDRESS_SYNC_VILLAGES_PER_RUN=5`
- `GEOPORTAL_CONTEXT_SYNC_VILLAGES_PER_RUN=5`
- `GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES=…,U09_Regionalny_zarzad_gospodarki_wodnej_PGWWP` (uwaga: sufiks `_PGWWP`)
- `GEOPORTAL_POI_SYNC_ENABLED=1`
- `NEXT_PUBLIC_GEOPORTAL_WMS_URL` + `NEXT_PUBLIC_GEOPORTAL_WMS_LAYERS=Raster`

Opcjonalnie (nie blokuje crona): `UPSTASH_REDIS_*`, Turnstile, Resend — sprawdź: `npm run sprawdz:env`.

```bash
npm run env:pull-vercel
npm run sprawdz:env -- --vercel .env.vercel.check
```

Synchronizacja z `.env.local` (production + preview):

```bash
npm run env:push-vercel
```

Usuń z Vercel błędne **Upstash Search** (`UPSTASH_SEARCH_*`) — rate limit wymaga **Redis REST** (`UPSTASH_REDIS_REST_*`).

Po dodaniu zmiennych: **Redeploy** produkcji.
