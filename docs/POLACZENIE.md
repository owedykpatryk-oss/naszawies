# Połączenie: Supabase, GitHub, Vercel

Stan na setup z asystenta (kwiecień 2026):

## Supabase — zrobione lokalnie

- Utworzono projekt **`naszawies-pl`** (region **eu-central-1**), ref: **`qxvdjghfsrrxrivfahmn`**.
- W katalogu projektu wykonano `supabase link` oraz `supabase db push` — na bazie jest tabela **`waitlist`** z RLS (anon może tylko `INSERT`).
- Panel: [Supabase — naszawies-pl](https://supabase.com/dashboard/project/qxvdjghfsrrxrivfahmn).

### Hasło do bazy (PostgreSQL)

Ustawione przy tworzeniu projektu w CLI — **nie jest w repozytorium**. Jeśli go nie zapisałeś: w panelu Supabase → **Project Settings → Database** wygeneruj nowe hasło.

### Klucze API

- **Anon key** (publiczny, do `NEXT_PUBLIC_SUPABASE_ANON_KEY`) skopiuj z panelu: **Settings → API**.
- Lokalnie możesz mieć już plik **`.env.local`** (jest w `.gitignore` — nie commituj).
- **Service role** trzymaj tylko w sekretach serwera (np. Vercel Environment Variables, typ „Sensitive”) — nigdy w `NEXT_PUBLIC_*`.

### Pełny schemat z dokumentacji

Kolejne tabele: uruchom SQL z `Cloude Docs/naszawies-package/database/schema.sql` i `rls-policies.sql` w **SQL Editor** (albo dodaj migracje i `db push`), gdy będziesz gotowy na MVP — obecna migracja to tylko **waitlist** na Fazę 0.

---

## GitHub — do zrobienia u Ciebie

CLI `gh` nie był zalogowany na tym komputerze.

1. Zaloguj się: `gh auth login`
2. Utwórz repo i wypchnij kod (z katalogu `naszawies`):

```bash
git remote add origin https://github.com/TWOJ_LOGIN/naszawies.git
# albo: gh repo create naszawies --private --source=. --remote=origin --push
git push -u origin master
```

---

## Plausible (opcjonalnie)

W `.env.local` / Vercel dodaj `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=naszawies.pl` (bez `https://`). Wtedy w `layout.tsx` ładuje się skrypt Plausible. Konto załóż na [plausible.io](https://plausible.io).

## Vercel — do zrobienia u Ciebie

CLI Vercel nie miał zapisanych poświadczeń.

1. `vercel login`
2. W katalogu `naszawies`: `vercel link` (wybierz konto i utwórz projekt **naszawies** lub podłącz istniejący).
3. W panelu Vercel → **Settings → Environment Variables** dodaj dla **Production** (i ewentualnie Preview):

   - `NEXT_PUBLIC_SUPABASE_URL` = `https://qxvdjghfsrrxrivfahmn.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ten sam anon key co w `.env.local`

4. Deploy: `vercel --prod` albo przez podpięcie repozytorium GitHub (automatyczne buildy przy pushu).

### Domena naszawies.pl

W Vercel → **Domains** dodaj `naszawies.pl` i `www.naszawies.pl`, ustaw rekordy DNS według kreatora Vercel (u rejestratora NASK).

---

## GitHub Actions (CI)

W repozytorium GitHub: **Settings → Secrets and variables → Actions → New repository secret** dodaj:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(bez cudzysłowów w nazwie; wartości jak w Vercel). Dzięki temu job **build** w `.github/workflows/ci.yml` przejdzie na GitHubie.

## Bezpieczeństwo

Jeśli klucz **anon** lub **service_role** trafił do logów czatu / screenów — w panelu Supabase możesz **rotować** klucze (Settings → API → Rotate). Po rotacji zaktualizuj `.env.local`, Vercel i sekrety GitHub.

---

## Przydatne komendy

| Cel | Komenda |
|-----|---------|
| Odświeżyć landing z Cloude Docs | `npm run sync-landing` |
| Nowa migracja | `npx supabase@2.90.0 migration new nazwa` |
| Wypchnięcie migracji na Supabase | `npx supabase@2.90.0 db push` |
| Build lokalny | `npm run build` |
