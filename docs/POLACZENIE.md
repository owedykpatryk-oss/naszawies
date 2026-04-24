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
8. **Supabase → Authentication → URL Configuration** — **Site URL** = `https://naszawies.pl` (lub główny adres z www), **Redirect URLs** = `https://naszawies.pl/**`, `https://www.naszawies.pl/**`, `http://localhost:3000/**`, oraz na czas testów z **Preview** na Vercel: `https://*.vercel.app/**` (inaczej link z maila po rejestracji na preview może być odrzucony i sesja się nie utworzy).
8b. **E-mail po rejestracji (potwierdzenie)** — wysyła go **Supabase Auth**, nie formularz kontaktowy (Resend). Jeśli nikt nie dostaje maila:
   - **Supabase → Authentication → Providers → Email** — dostawca włączony; sprawdź, czy **„Confirm email”** jest zgodnie z oczekiwaniami (wyłączone = brak maila, logowanie od razu hasłem).
   - **Authentication → Logs** — czy `signup` / wysyłka szablonu zakończyła się błędem lub limitem.
   - **Vercel** — ustaw **`NEXT_PUBLIC_SITE_URL`** na ten sam kanoniczny adres co **Site URL** w Supabase (np. `https://naszawies.pl`), żeby w mailu był poprawny link do `/auth/potwierdz`.
   - Skrzynka **Spam / Oferty**, literówka w adresie, opóźnienia kilkunastu minut.
   - **Authentication → Users** — czy konto istnieje i ma status **Confirmed** (jeśli tak, użytkownik może się logować nawet bez otwarcia maila).
9. **Opcjonalnie Resend** — domena `naszawies.pl` w Resend (SPF/DKIM wg ich kreatora); w Vercel popraw `RESEND_ZE_STRONY` na np. `Kontakt <kontakt@naszawies.pl>` po weryfikacji. (To **nie** zastępuje maili Supabase Auth — na własny SMTP dla Auth: Supabase → Project Settings → Auth → SMTP.)
10. **Test** — waitlist z produkcji, `/api/kontakt` (jeśli brak Resend, kontakt może zwrócić 503).

Szczegóły kroków 2–7 i Supabase: sekcje poniżej (**GitHub**, **Vercel + domena**). CI GitHub Actions: sekcja **GitHub Actions**.

---

## Szczegółowy przewodnik — co zrobić teraz (krok po kroku)

Założenie: masz konto **Vercel**, repo **`owedykpatryk-oss/naszawies`** na GitHubie i projekt **Supabase** `qxvdjghfsrrxrivfahmn`.

### Krok 1 — Supabase: skopiuj dane do schowka (na później)

1. Otwórz [Supabase — API](https://supabase.com/dashboard/project/qxvdjghfsrrxrivfahmn/settings/api).
2. Skopiuj **Project URL** (wygląda jak `https://qxvdjghfsrrxrivfahmn.supabase.co`).
3. Skopiuj klucz **`anon` `public`** (długi JWT) — to **nie** jest `service_role`.

### Krok 2 — Vercel: nowy projekt z GitHuba

1. Wejdź na [vercel.com](https://vercel.com) → zaloguj się.
2. **Add New…** → **Project**.
3. **Import** repozytorium **`naszawies`** (jeśli nie widać: [GitHub → Applications → Vercel](https://github.com/settings/installations) → **Configure** → dostęp do repo).
4. **Framework Preset:** Next.js (wykryje się z `package.json`).
5. **Root Directory:** zostaw `.` / root (chyba że aplikacja jest w podfolderze — u Ciebie jest w root).
6. **Environment Variables** — **jeszcze na tym ekranie importu** (albo od razu po utworzeniu w **Settings → Environment Variables**) dodaj:

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | wklej Project URL z kroku 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | wklej klucz `anon` z kroku 1 |

   Zakres: zaznacz **Production** (opcjonalnie też **Preview** tymi samymi wartościami).

7. Kliknij **Deploy** i poczekaj na zielony build.
8. Otwórz wygenerowany adres **`https://nazwa-projektu.vercel.app`** — strona główna ma się załadować.

### Gdzie to jest w panelu Vercel (nawigacja)

- **Domena własna** (`naszawies.pl`): u góry projektu wybierz **Settings** (nie „Deployments”) → w **lewym** menu **Domains**.
- **Gałąź produkcyjna** (`master` vs `main`): **Settings** → **Git** → **Production Branch**.
- **Zmienne Supabase / Resend**: **Settings** → **Environment Variables**.

### Krok 3 — Vercel: domena `naszawies.pl`

1. W projekcie **naszawies** kliknij **Settings** (obok Deployments, Analytics itd.) → **Domains** (lewa kolumna).
2. W polu dodawania wpisz **`naszawies.pl`** → **Add** (potwierdź, jeśli pyta o przekierowanie www — możesz włączyć przekierowanie `www` ↔ apex według preferencji).
3. Dodaj też **`www.naszawies.pl`** (jeśli nie dodało się automatycznie).
4. Dla każdej domeni Vercel pokaże **instrukcję DNS** — zrób zrzut ekranu lub zapisz:
   - rekord **A** dla `@` (często IP **`76.76.21.21`** — **jeśli u Ciebie jest inny numer, obowiązuje ten z Vercel**),
   - rekord **CNAME** dla `www` (zwykle wskazanie na `cname.vercel-dns.com` lub podobne — **dokładnie jak w Vercel**).

### Krok 4 — GoDaddy: DNS

1. Zaloguj się w GoDaddy → **Moje produkty** → **naszawies.pl** → **DNS** / **Zarządzaj DNS**.
2. Rekord **A** dla **`@`**:
   - Jeśli jest „WebsiteBuilder” / stary hosting — **edytuj** lub **usuń** i utwórz nowy **A** dla `@` = **IP z Vercel** (krok 3).
3. Rekord **CNAME** dla **`www`**:
   - Zmień wartość na **host z panelu Vercel** (np. `cname.vercel-dns.com.`), **nie** zostawiaj `www` → `naszawies.pl`, jeśli Vercel każe inaczej.
4. Rekordów **NS** (`ns07` / `ns08.domaincontrol.com`) **nie zmieniaj**.
5. Opcjonalnie: jeśli Vercel każe dodać rekord **TXT** (weryfikacja) — dodaj dokładnie jak w instrukcji.

Propagacja: od kilku minut do kilku godzin. W Vercel → **Domains** status zmieni się na **Valid** (SSL).

### Krok 5 — Supabase: adresy strony (logowanie później)

1. Otwórz [URL Configuration](https://supabase.com/dashboard/project/qxvdjghfsrrxrivfahmn/auth/url-configuration).
2. **Site URL:** `https://naszawies.pl` (albo `https://www.naszawies.pl`, jeśli tak ma być „główny” adres — spójnie z przekierowaniami w Vercel).
3. **Redirect URLs** — **Add URL** i wklej (każda osobno lub w zależności od UI):

   - `https://naszawies.pl/**`
   - `https://www.naszawies.pl/**`
   - `http://localhost:3000/**`
   - **Ważne po wdrożeniu Auth:** pełne ścieżki wymiany kodu z e-maila (PKCE):  
     `https://naszawies.pl/auth/potwierdz` oraz `https://www.naszawies.pl/auth/potwierdz` oraz  
     `http://localhost:3000/auth/potwierdz` (lokalnie).
   - **Reset hasła:** w aplikacji `redirectTo` wskazuje na `/auth/potwierdz?next=…/auth/ustaw-haslo` — wystarczy wildcard `/**`; jeśli Supabase wymaga jawnych adresów, dopisz też  
     `https://naszawies.pl/auth/ustaw-haslo`, `https://www.naszawies.pl/auth/ustaw-haslo`, `http://localhost:3000/auth/ustaw-haslo`.

4. Zapisz (**Save**).

### Logowanie Google i GitHub (OAuth)

W aplikacji są przyciski na `/logowanie` i `/rejestracja`. W **Supabase** musisz włączyć dostawców i dodać klucze OAuth.

#### Google

1. [Google Cloud Console](https://console.cloud.google.com/) → projekt (lub nowy) → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID** → typ **Web application**.
2. **Authorized redirect URIs** — dodaj dokładnie (podmień ref na swój z **Settings → API** w Supabase):

   `https://qxvdjghfsrrxrivfahmn.supabase.co/auth/v1/callback`

3. Skopiuj **Client ID** i **Client Secret**.
4. Supabase → **Authentication** → **Providers** → **Google** → włącz, wklej ID i sekret → **Save**.

#### GitHub

1. GitHub → **Settings** (konto lub organizacja) → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. **Authorization callback URL** (to samo co u Google):

   `https://qxvdjghfsrrxrivfahmn.supabase.co/auth/v1/callback`

3. **Homepage URL:** `https://naszawies.pl` (lub strona projektu).
4. Skopiuj **Client ID** i wygeneruj **Client secrets**.
5. Supabase → **Authentication** → **Providers** → **GitHub** → włącz, wklej wartości → **Save**.

Po zapisaniu odśwież `/logowanie` i sprawdź przyciski (pierwsze logowanie utworzy konto w `auth.users` i wiersz w `public.users` dzięki triggerowi).

### Krok 6 — Resend (opcjonalnie, żeby działał `/kontakt`)

Bez tego formularz kontaktowy na produkcji może zwracać błąd serwera.

1. [resend.com](https://resend.com) → API Keys → utwórz klucz.
2. W Vercel → **Environment Variables** dodaj `RESEND_API_KEY` oraz `RESEND_ZE_STRONY` (np. `Kontakt <onboarding@resend.dev>` zanim zweryfikujesz własną domenę).
3. **Deployments** → **⋯** przy ostatnim deployu → **Redeploy** (żeby wczytał nowe zmienne).

### Krok 7 — testy

| Co sprawdzić | Jak |
|----------------|-----|
| Strona z Vercel | Adres `*.vercel.app` — landing OK. |
| Własna domena | `https://naszawies.pl` — po **Valid** w Vercel. |
| Waitlist | Zapis z formularza na stronie — w Supabase **Table Editor → waitlist** nowy wiersz. |
| Kontakt | Tylko po Resend + redeploy — wysłanie wiadomości bez błędu w konsoli sieciowej. |

**Podgląd w panelu Vercel pokazuje `404: NOT_FOUND`, a deploy jest „Ready”?**

1. **Najczęstsza przyczyna — zła gałąź Production**  
   Repo używa **`master`**, a Vercel domyślnie często ustawia produkcję na **`main`**. Wtedy każdy push na `master` to tylko **Preview**, a adres **`https://naszawies.vercel.app`** (produkcja) **nie ma wdrożenia** → platforma zwraca `404` + `X-Vercel-Error: NOT_FOUND` (tekst `text/plain`, nie HTML Nexta).  
   **Naprawa:** Vercel → **Settings → Git** → **Production Branch** → ustaw **`master`** → **Save** → **Deployments** → **⋯** przy ostatnim deployu z `master` → **Promote to Production** (albo pusty commit / Redeploy po zmianie gałęzi).

2. **Podgląd w iframe** — nadal może być dziwny; sprawdź zawsze **Visit** w nowej karcie na `https://naszawies.vercel.app`.

3. **Ochrona wdrożeń (401 na długim URL `…-git-master-…`)**  
   **Settings → Deployment Protection** — podgląd z zewnątrz (curl / incognito) może dawać **401**; zalogowany użytkownik Vercel widzi stronę. Na produkcję (`*.vercel.app` główny) zwykle nie blokuje — po naprawie gałęzi sprawdź ponownie.

### Krok 8 — GitHub Actions (opcjonalnie)

W repo GitHub: **Settings → Secrets and variables → Actions** — dodaj `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` (jak w Vercel), żeby workflow CI przechodził przy pushu.

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
