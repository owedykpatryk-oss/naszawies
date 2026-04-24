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

## Produkcja (Supabase Cloud)

1. Otwórz [Email Templates](https://supabase.com/dashboard/project/_/auth/templates) dla swojego projektu.
2. Dla każdego typu wiadomości ustaw **Subject** zgodnie z `supabase/config.toml` (sekcje `[auth.email.template.*]` → `subject`) albo własny, spójny z marką.
3. Wklej **całą** zawartość odpowiedniego pliku `.html` do pola treści (body) szablonu.
4. Zapisz. Wyślij test (np. rejestracja na staging / drugi adres).

Lokalnie (`supabase start`) te same pliki ładują się z `config.toml` — podgląd w Inbucket (`http://127.0.0.1:54324`).

## Management API (opcjonalnie)

Możesz zsynchronizować szablony skryptem `curl` z tokenem z [Account → Access Tokens](https://supabase.com/dashboard/account/tokens). Klucze JSON to m.in. `mailer_templates_confirmation_content`, `mailer_subjects_confirmation` itd. — zob. [dokumentacja](https://supabase.com/docs/guides/auth/auth-email-templates).

## Własny SMTP + nadawca

Żeby w polu „Od” było np. `naszawies.pl` zamiast domyślnego nadawcy Supabase, włącz **Custom SMTP** w projekcie (Auth) i zweryfikuj domenę u dostawcy (np. Resend SMTP).

## Resend (kontakt, waitlist)

Wiadomości z API (`/api/kontakt`, waitlist) używają wspólnego szablonu w kodzie: `src/lib/email/szablon-html-naszawies.ts` oraz tego samego logo pod `NEXT_PUBLIC_SITE_URL`.
