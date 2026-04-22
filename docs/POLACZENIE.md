# Połączenie: Supabase, GitHub, Vercel

Stan na setup z asystenta (kwiecień 2026):

## Jak to się łączy (big picture)

| Element | Rola |
|---------|------|
| **GoDaddy (DNS)** | Mówi światu: domena `naszawies.pl` / `www` → **Vercel** (rekordy A / CNAME z panelu Vercel). |
| **Vercel** | Hostuje **stronę** (Next.js), buduje z **GitHuba**, trzyma **zmienne** (`NEXT_PUBLIC_SUPABASE_*`, Resend…). |
| **Supabase** | **Baza + Auth** pod adresem `https://…supabase.co` — strona **nie** leży na Supabase; łączysz ją tylko **kluczami** w Vercel. |
| **Resend** | Wysyłka e-maili z formularza — osobny serwis; klucze w Vercel. |

Przepływ użytkownika: przeglądarka → **DNS** → **Vercel** → HTML/JS → przy waitlist/kontakt wywołanie **API na Vercelu** → ten sam deploy woła **Supabase** (klucz anon) lub **Resend**.

---

## Checklista: od repozytorium do działającej domeny

Wykonaj **po kolei** (numery mają znaczenie).

1. **GitHub** — kod w repozytorium (np. `owedykpatryk-oss/naszawies`), gałąź z której buduje Vercel (np. `master`).
2. **Vercel** — **Add New… → Project** → Import z GitHuba → wybierz `naszawies`, **Root Directory** = katalog z `package.json` (zwykle root repo). Zapisz.
3. **Vercel → Settings → Environment Variables** — dodaj co najmniej `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` (wartości z Supabase → Settings → API), zakres **Production** (i Preview, jeśli chcesz). Zrób **Redeploy**, żeby pierwszy build miał zmienne.
4. **Deploy** — upewnij się, że build jest zielony; adres `https://…vercel.app` otwiera stronę.
5. **Vercel → Settings → Domains** — dodaj `naszawies.pl` i `www.naszawies.pl`. Zapisz **dokładnie** to, co Vercel podaje (IP A, CNAME www, ewentualnie TXT weryfikacyjny).
6. **GoDaddy → DNS** — usuń / zmień rekord **A** dla `@` z „Website Builder” na **IP z Vercel** (często `76.76.21.21` — jeśli Vercel poda inny, użyj ich). **CNAME** `www` → wartość z Vercel (np. `cname.vercel-dns.com`). NS zostaw.
7. Poczekaj na propagację DNS (od minut do kilku godzin). W Vercel przy domenie ma być **Valid** (certyfikat SSL).
8. **Supabase → Authentication → URL Configuration** — **Site URL** = `https://naszawies.pl` (lub główny adres z www), **Redirect URLs** = `https://naszawies.pl/**`, `https://www.naszawies.pl/**`, `http://localhost:3000/**`.
9. **Opcjonalnie Resend** — domena `naszawies.pl` w Resend (SPF/DKIM wg ich kreatora); w Vercel popraw `RESEND_ZE_STRONY` na np. `Kontakt <kontakt@naszawies.pl>` po weryfikacji.
10. **Test** — waitlist z produkcji, `/api/kontakt` (jeśli brak Resend, kontakt może zwrócić 503).

Szczegóły kroków 2–7 i Supabase: sekcje poniżej (**GitHub**, **Vercel + domena**). CI GitHub Actions: sekcja **GitHub Actions**.

---

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

W repozytorium jest migracja `supabase/migrations/20260423140000_schemat_i_rls_z_dokumentacji.sql` (schemat + RLS z pakietu dokumentów). Po `db push` masz m.in. **`villages`**, **`users`**, role wsi itd. Skrypt **`npm run import-teryt`** (pliki `TERC.xml` + `SIMC.xml` z GUS) wypełnia `villages` — wymaga **`SUPABASE_SERVICE_ROLE_KEY`** (lokalnie w `.env.local`, nigdy w repo).

### Resend i powiadomienia

- **`RESEND_API_KEY`**, **`RESEND_ZE_STRONY`** — wysyłka z `/api/kontakt`.
- Opcjonalnie **`WAITLIST_POWIADOMIENIA_EMAIL`** — kopia e-maila przy nowym zapisie na listę (jeśli puste, powiadomienie jest pomijane).

---

## GitHub — wymagane przed importem w Vercel

**Dlaczego na liście „Import Git Repository” nie ma `naszawies`?** Kod był tylko na dysku — **nie było** `git remote` ani repozytorium na GitHubie. Vercel pokazuje wyłącznie repozytoria, które **już istnieją** na podłączonym koncie GitHub (`owedykpatryk-oss` itd.).

Na tym komputerze zrobiono już **lokalny commit** (`master`). Zostało u Ciebie: utworzyć puste repo na GitHubie i **pierwszy push**.

### Opcja A — przeglądarka

1. GitHub → **New repository** → nazwa np. `naszawies` (prywatne/publiczne wg potrzeby), **bez** README (pusty start).
2. W katalogu `naszawies` w terminalu (ścieżka jak u Ciebie, np. `E:\Naszawies.pl\naszawies`):

```bash
git remote add origin https://github.com/owedykpatryk-oss/naszawies.git
git push -u origin master
```

(adres `origin` skopiuj z GitHuba po utworzeniu repozytorium — przycisk „…or push an existing repository”)

### Opcja B — GitHub CLI

```bash
gh auth login
cd naszawies
gh repo create naszawies --private --source=. --remote=origin --push
```

### Vercel nadal nie widzi nowego repo?

GitHub → **Settings** (Twoje konto lub organizacja) → **Applications** → **Installed GitHub Apps** → **Vercel** → **Configure** → **Repository access** → włącz **All repositories** albo wybierz **`naszawies`**. Potem odśwież stronę importu w Vercel.

---

## Plausible (opcjonalnie)

W `.env.local` / Vercel dodaj `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=naszawies.pl` (bez `https://`). Wtedy w `layout.tsx` ładuje się skrypt Plausible. Konto załóż na [plausible.io](https://plausible.io).

## Vercel + domena (żeby strona była online)

**Kolejność:** projekt na Vercel → zmienne środowiskowe → deploy → domeny w Vercel → **DNS u rejestratora** (u Ciebie: GoDaddy / `domaincontrol.com`). Supabase jest osobno: tylko **klucze w Vercel** + **URL-e w panelu Auth** (patrz punkt 6).

### 1. Vercel — CLI

```bash
cd naszawies
npx vercel login
npx vercel link
```

### 2. Zmienne w Vercel (Production)

**Project → Settings → Environment Variables:**

| Nazwa | Wartość |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qxvdjghfsrrxrivfahmn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → **Settings → API** → `anon` |
| `RESEND_API_KEY`, `RESEND_ZE_STRONY` | z Resend (kontakt / opcjonalne maile waitlist) |
| `KONTAKT_EMAIL_DOCELOWY`, `WAITLIST_POWIADOMIENIA_EMAIL` | opcjonalnie |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | opcjonalnie: `naszawies.pl` |

`SUPABASE_SERVICE_ROLE_KEY` **nie** dawaj do zmiennych `NEXT_PUBLIC_*` (tylko backend / skrypty).

### 3. Deploy

`npx vercel --prod` albo podłączenie repozytorium GitHub w panelu Vercel (build przy każdym pushu).

### 4. Domeny w Vercel

**Settings → Domains:** dodaj `naszawies.pl` i `www.naszawies.pl`. Skopiuj z ekranu Vercel **dokładne** rekordy DNS (to obowiązuje przy wpisywaniu u rejestratora).

### 5. DNS w GoDaddy (masz teraz Website Builder na `@`)

Na panelu DNS widać rekord **A** dla **`@`** = **„WebsiteBuilder Site”** — żeby apex wskazywał na Vercel, **edytuj lub usuń** ten wpis i ustaw rekord **A** dla `@` na adres IP podany przez Vercel (w dokumentacji Vercel często podawany jest **`76.76.21.21`** dla domeny głównej; jeśli w Twoim projekcie Vercel pokazuje inny — użyj **ich** wartości).

**`www`:** zamiast CNAME `www` → `naszawies.pl` ustaw zwykle CNAME **`www` → `cname.vercel-dns.com.`** (dokładna wartość z listy Vercel przy domenie).

Rekordy **NS** (`ns07` / `ns08.domaincontrol.com`) zostaw bez zmian.

### 6. Supabase — tylko URL (strona stoi na Vercel)

Panel: **Authentication → URL Configuration** ([bezpośredni projekt](https://supabase.com/dashboard/project/qxvdjghfsrrxrivfahmn/auth/url-configuration)):

- **Site URL:** `https://naszawies.pl` (lub `https://www.naszawies.pl`, jeśli to ma być główny adres)
- **Redirect URLs:** np. `https://naszawies.pl/**`, `https://www.naszawies.pl/**`, `http://localhost:3000/**`

Dzięki temu późniejsze logowanie (OAuth / link e-mail) nie będzie wracało na zły host.

### 7. Test

Działa adres `*.vercel.app` → potem `https://naszawies.pl` po propagacji DNS; w Vercel przy domenie status **Valid**.

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
| Import TERYT do `villages` | `npm run import-teryt -- --dry-run ścieżka/TERC.xml ścieżka/SIMC.xml` (bez zapisu) lub bez `--dry-run` + `SUPABASE_SERVICE_ROLE_KEY` |
| Złożenie migracji schematu z dokumentów | `npm run generuj-migracje-schema` |
