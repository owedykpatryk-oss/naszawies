# Cloudflare — NaszaWies.pl

Integracja: **R2** (storage), **Turnstile** (anty-bot), **CDN + Worker** (publiczne URL), **Image Resizing** (miniaturki).

## Szybki start (checklist)

1. **Turnstile** — [dash.cloudflare.com](https://dash.cloudflare.com/) → Turnstile → widget dla `naszawies.pl` i `www.naszawies.pl`
   ```env
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=…
   TURNSTILE_SECRET_KEY=…
   ```

2. **R2 — buckety** (REST API, nie klucze S3):
   ```env
   CLOUDFLARE_R2_ACCOUNT_ID=…
   CLOUDFLARE_API_TOKEN=…   # Account → R2 Storage → Edit
   ```
   ```bash
   npm run r2:buckets
   ```

3. **R2 — upload z aplikacji** (S3 API):
   ```env
   CLOUDFLARE_R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   CLOUDFLARE_R2_ACCESS_KEY_ID=…
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=…
   ```
   Test: `npm run r2:s3-ping`

4. **CDN Worker** (jedna domena dla wszystkich bucketów):
   ```bash
   npm run r2:deploy-worker
   ```
   W Cloudflare: Workers → `naszawies-r2-cdn` → **Custom Domains** → `cdn.naszawies.pl`

5. **Zmienne publiczne** (Vercel Production + Preview):
   ```env
   NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://cdn.naszawies.pl
   CLOUDFLARE_R2_PUBLIC_BASE_URL=https://cdn.naszawies.pl
   ```
   Gdy `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` jest ustawione, aplikacja wgrywa na R2 zamiast Supabase Storage (avatary, rynek, świetlica, fotokronika, ładne miejsca).

6. **Image Resizing** (opcjonalnie, zalecane):
   - Cloudflare Dashboard → strefa `naszawies.pl` → **Speed** → **Optimization** → Image Resizing (wymaga planu z tą funkcją)
   ```env
   NEXT_PUBLIC_R2_CDN_IMAGES=1
   ```
   Aplikacja buduje URL-e: `https://cdn.naszawies.pl/cdn-cgi/image/width=640,quality=85,format=auto/marketplace/…`

---

## Buckety R2

| Bucket | Zastosowanie |
|--------|----------------|
| `avatars` | Zdjęcia profilowe |
| `marketplace` | Zdjęcia ogłoszeń (w tym działki, max 5) |
| `hall-inventory` | Wyposażenie świetlicy |
| `hall-booking-damage` | Dokumentacja zniszczeń rezerwacji |
| `hall-rules` | Regulaminy sal (PDF/obraz) |
| `village-photos` | Fotokronika + ładne miejsca na mapie |

Publiczny URL (Worker): `https://cdn.naszawies.pl/{bucket}/{klucz}`

Kod bucketów: `src/lib/cloudflare/r2-bucket-znaczniki.ts`  
Upload serwerowy: `src/lib/storage/wgraj-obraz-r2.ts`

---

## Turnstile — gdzie działa

| Miejsce | Plik |
|---------|------|
| Kontakt | `kontakt-formularz.tsx` → `/api/kontakt` |
| Zgłoszenie naruszenia | `zglos-naruszenie-formularz.tsx` |
| Waitlist (landing) | `landing-body.html` → `/api/waitlist` |

Walidacja: `src/lib/turnstile/waliduj-token-serwer.ts`  
Gdy brak `TURNSTILE_SECRET_KEY` — walidacja pomijana (dev).

---

## Optymalizacja obrazów w UI

- Helper: `src/lib/cloudflare/r2-obraz.ts` — presety `miniatura`, `karta`, `pelny`, `avatar`
- Komponent: `src/components/media/obraz-r2.tsx`
- Używane m.in. na kartach rynku (`rynek-ui.tsx`)

---

## Worker CDN (`cloudflare/r2-cdn-worker/`)

- Serwuje obiekty z R2 z nagłówkiem `Cache-Control: public, max-age=31536000, immutable`
- Przepuszcza `/cdn-cgi/image/*` do Cloudflare Image Resizing
- CORS: `Access-Control-Allow-Origin: *` (publiczne zdjęcia)

Deploy:
```bash
cd cloudflare/r2-cdn-worker && npx wrangler deploy
```
lub z root: `npm run r2:deploy-worker`

---

## Audyt konfiguracji

```bash
npm run sprawdz:env
npm run r2:s3-ping
```

---

## Co warto dodać później

| Usługa | Po co |
|--------|--------|
| **Cloudflare WAF** | Ochrona API przed floodem (uzupełnia Upstash rate limit) |
| **Cache Rules** | Dłuższy cache dla `/cdn-cgi/image/*` |
| **R2 lifecycle** | Auto-usuwanie starych uploadów z folderów tymczasowych |
| **Backup DB → R2** | Cron zrzutu Supabase do bucketu `backups` |
| **Turnstile na upload** | Opcjonalnie przy masowym wgrywaniu zdjęć rynku |

---

## Migracja z Supabase Storage

1. Ustaw R2 + CDN (kroki 1–5).
2. Nowe pliki trafiają automatycznie na R2.
3. Stare URL-e Supabase nadal działają (nie migruj masowo bez potrzeby).
4. Opcjonalnie: skrypt kopiujący obiekty Supabase → R2 + UPDATE URL w bazie (osobny task).
