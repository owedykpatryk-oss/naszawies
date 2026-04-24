# Szablony e-maili Auth (naszawies.pl)

Maile **logowania / rejestracji / resetu hasła** wysyła **Supabase Auth**, nie Resend. Wygląd (logo, kolory, treść PL) definiują pliki HTML w repozytorium:

| Plik | Szablon w panelu Supabase |
|------|---------------------------|
| `supabase/templates/email/potwierdzenie.html` | Confirm signup |
| `supabase/templates/email/odbuduj-haslo.html` | Reset password |
| `supabase/templates/email/magic-link.html` | Magic link |
| `supabase/templates/email/zmiana-email.html` | Change email address |
| `supabase/templates/email/zaproszenie.html` | Invite user |
| `supabase/templates/email/potwierdz-dzialanie.html` | Reauthentication |

**Logo w mailu** ładuje się z Twojej strony: `{{ .SiteURL }}/email/znak-naszawies.svg` (plik `public/email/znak-naszawies.svg`). Dlatego w Supabase **Site URL** musi być publiczny adres produkcji (np. `https://naszawies.pl`), a deploy na Vercel musi zawierać ten plik w `public/`.

## Produkcja — automatyczne wgranie (zalecane)

Z katalogu `naszawies`:

1. Utwórz **Personal Access Token** w [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) (dostęp do organizacji z projektem).
2. W pliku **`.env.local`** (nie commituj) dodaj linię:

```env
SUPABASE_ACCESS_TOKEN=twoj_token_z_panelu
```

3. Z katalogu projektu:

```bash
npm run wgraj:szablony-maili
```

Skrypt sam wczytuje `.env.local` (m.in. `NEXT_PUBLIC_SUPABASE_URL` → ref projektu).

Podgląd bez zapisu: `node scripts/wgraj-szablony-maili-supabase.mjs --dry-run`

Jednorazowo bez pliku: PowerShell `$env:SUPABASE_ACCESS_TOKEN="..."; npm run wgraj:szablony-maili`

Skrypt: `scripts/wgraj-szablony-maili-supabase.mjs` — czyta pliki z `supabase/templates/email/` i robi `PATCH` na [Management API](https://supabase.com/docs/guides/auth/auth-email-templates) (`/v1/projects/{ref}/config/auth`).

Jeśli API zwraca **403**, token lub rola w organizacji może nie mieć uprawnień do zmiany Auth — użyj konta z dostępem właściciela / wygeneruj token z odpowiednim scope albo wklej szablony ręcznie w panelu.

## Produkcja (ręcznie w panelu)

1. [Email Templates](https://supabase.com/dashboard/project/_/auth/templates)
2. Dla każdego typu: **Subject** jak w `supabase/config.toml`, treść = cały plik `.html` z repozytorium.

Lokalnie (`supabase start`) te same pliki ładują się z `config.toml` — podgląd w Inbucket (`http://127.0.0.1:54324`).

## Własny SMTP + nadawca

Żeby w polu „Od” było np. `naszawies.pl` zamiast domyślnego nadawcy Supabase, włącz **Custom SMTP** w projekcie (Auth) i zweryfikuj domenę u dostawcy (np. Resend SMTP).

## Resend (kontakt, waitlist)

Wiadomości z API (`/api/kontakt`, waitlist) używają wspólnego szablonu w kodzie: `src/lib/email/szablon-html-naszawies.ts` oraz tego samego logo pod `NEXT_PUBLIC_SITE_URL`.
