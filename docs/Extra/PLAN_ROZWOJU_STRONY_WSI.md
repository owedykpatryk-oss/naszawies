# NASZAWIES.PL — ANALIZA, LUKI I SZCZEGÓŁOWA ROADMAPA WDROŻENIOWA

| Pole | Wartość |
|------|---------|
| **Wersja dokumentu** | 1.5 |
| **Ostatnia aktualizacja** | 2026-05-03 |
| **Zakres** | Kod `naszawies/`, migracje `naszawies/supabase/migrations/` |
| **Dokument towarzyszący** | `OPIS_APLIKACJI_DO_ANALIZY_AI.txt` (inwentaryzacja modułów, stack, RLS) |

> Dokument przeznaczony do wklejenia do Cursora jako kontekst dla zadań programistycznych.
> Każda większa sekcja stara się zawierać: **Co dodać/zmienić**, **Dlaczego**, **Kierunek implementacji (SQL/TS/struktura)** oraz **Akceptację**, o ile ma to sens.

**Jak używać w Cursorze:** Do jednego zadania dołączaj tylko fragment planu (np. jeden sprint lub jedną sekcję 1.x–4.x), żeby model nie przeoczył szczegółów. Po wdrożeniu zaktualizuj checkboxy w §17 lub dopisz wpis do §18 (historia zmian).

**Konwencja nazewnictwa**: Wszystkie nowe nazwy plików, funkcji, kolumn — po polsku (zgodnie z istniejącą bazą kodu). Tylko biblioteki i protokoły (np. `RLS`, `RPC`, `WebPush`) zostają po angielsku.

**Uwaga do fragmentów SQL w tym pliku:** Przykłady są **szkicami wdrożeniowymi**. Przed merge sprawdź nazwy kolumn i typy względem aktualnego schematu (`OPIS` + migracje), dodaj `IF NOT EXISTS` / bezpieczne `ALTER` zgodnie z polityką migracji w repo.

---

## SPIS TREŚCI

0. [Stan względem kodu (skrót)](#0-stan-względem-kodu-skrót)
1. [Krytyczne luki bezpieczeństwa i compliance](#1-krytyczne-luki-bezpieczeństwa-i-compliance)
2. [Spójna warstwa powiadomień (in-app, push, email, SMS)](#2-spójna-warstwa-powiadomień-in-app-push-email-sms)
3. [RODO — eksport, usunięcie konta, zgody](#3-rodo--eksport-usunięcie-konta-zgody)
4. [Rate limiting, anty-spam, CAPTCHA](#4-rate-limiting-anty-spam-captcha)
5. [Granice sołectw na PostGIS](#5-granice-sołectw-na-postgis)
6. [Obserwability — Sentry, logi cron, audyt](#6-obserwability)
7. [Backup, disaster recovery, retencja](#7-backup-disaster-recovery-retencja)
8. [Moderacja zgodna z DSA](#8-moderacja-zgodna-z-dsa)
9. [Dostępność (WCAG 2.1 AA) i UX dla osób 60+](#9-dostępność-wcag-21-aa-i-ux-dla-osób-60)
10. [Testy — pgTAP, Playwright, Vitest](#10-testy)
11. [Nowe moduły produktowe](#11-nowe-moduły-produktowe)
12. [Integracje z urzędami i danymi publicznymi](#12-integracje-z-urzędami-i-danymi-publicznymi)
13. [Monetyzacja bez płatności online](#13-monetyzacja-bez-płatności-online)
14. [Onboarding sołtysa](#14-onboarding-sołtysa)
15. [Drobne poprawki techniczne](#15-drobne-poprawki-techniczne)
16. [Brakujące sekcje w dokumentacji produktu](#16-brakujące-sekcje-w-dokumentacji-produktu)
17. [Plan wdrożenia (kolejność prac)](#17-plan-wdrożenia)
18. [Ryzyka, założenia, historia zmian](#18-ryzyka-założenia-historia-zmian)
19. [Jednostki publiczne i współpraca z gminą](#19-jednostki-publiczne-i-współpraca-z-gminą)

---

## 0. STAN WZGLĘDEM KODU (SKRÓT)

Poniżej: co **już widać w migracjach / opisie produktu** (2026-05), żeby nie planować drugi raz tego samego. Pełny inwentarz: `OPIS_APLIKACJI_DO_ANALIZY_AI.txt`.

| Obszar | Stan (wysoki poziom) | Ten dokument § |
|--------|----------------------|------------------|
| Web Push — subskrypcje w bazie | Tabela `user_web_push_subscriptions` (m.in. `20260504140000_...`) | §2 dalej: preferencje, digest, worker |
| RSS → wiadomości lokalne | `external_guid_hash`, kanały per wieś | §15.2 backoff |
| Automatyzacje wsi | Rozszerzenia `run_village_automation` (harmonogram, archiwizacja itd.) | §1.2 idempotencja, §7 retencja |
| Moduły społecznościowe | Blog, historia, marketplace, organizacje/kalendarz, KGW, przewodnik, mapa/POI | §11 nowe moduły (nie duplikować nazw tabel bez sprawdzenia) |
| Cron / API | **`Authorization: Bearer`** dla `/api/automatyzacje/run` i `/api/kanaly-rss/sync`; zapis audytu w `cron_runs` (`20260504150000_…`); **idempotencja** (`20260504160000_…`: `run_village_automation_for_cron`, lease RSS) | §1.1–1.2 |
| ESLint | Reguła `no-restricted-imports` dla `@/lib/supabase/admin-client` w plikach `*.tsx` | §1.3 |
| Rate limit | **Upstash** (`@upstash/ratelimit`): waitlist, kontakt, zgłoszenie naruszenia, wyszukiwarka wsi — przy `UPSTASH_REDIS_*` | §4 |
| Turnstile | **Cloudflare** — `cfTurnstileResponse` + `waliduj-token-serwer`; widget na kontakt, zgłoszenie, landing waitlist (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`) | §4.3 |
| Sentry | **`@sentry/nextjs`** — `instrumentation.ts`, konfiguracje `sentry.*.config.ts`, `global-error.tsx`; `withSentryConfig` gdy `SENTRY_DSN` | §6.1 |

**Priorytety P0–P2 (skrót):** **P0** — bezpieczeństwo i wyciek danych (cron, service role, RLS). **P1** — RODO, rate limit, krytyczny UX (powiadomienia). **P2** — moduły produktowe, integracje długiego horyzontu.

---

## 1. KRYTYCZNE LUKI BEZPIECZEŃSTWA I COMPLIANCE

### 1.1. Cron endpointy — zabezpieczenia minimalne

**Problem (historyczny):** Sekret crona w query stringu to anty-wzorzec — trafia do logów URL, referrerów, historii przeglądarek.

**Stan wdrożenia w kodzie (2026-05-03):** `czyZapytanieCronAutoryzowane` w `src/lib/api/autoryzacja-cron.ts` akceptuje wyłącznie **`Authorization: Bearer <CRON_SECRET>`** (bez `?secret=` i bez `x-cron-secret`). Po każdym wywołaniu cron zapisuje wynik do **`cron_runs`** (`zapisz-cron-run.ts` + migracja poniżej). **Allowlist IP** — nadal opcjonalna warstwa (patrz §18.1).

**SQL — migracja wdrożona jako `20260504150000_cron_runs_audyt.sql` (wzorzec; kolumna IP jako TEXT):**

```sql
CREATE TABLE IF NOT EXISTS cron_runs (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  affected_rows JSONB,
  error_message TEXT,
  source_ip INET,
  user_agent TEXT
);

CREATE INDEX idx_cron_runs_endpoint_started ON cron_runs(endpoint, started_at DESC);
CREATE INDEX idx_cron_runs_status ON cron_runs(status) WHERE status = 'error';

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY cron_runs_admin_only ON cron_runs
  FOR SELECT USING (is_platform_admin());
```

**TS — w repo:** `src/lib/api/autoryzacja-cron.ts` (produkcja). Poniżej szkic rozszerzony o allowlist IP (nie wdrożony jako domyślny):

```typescript
import { NextRequest } from "next/server";

const VERCEL_CRON_IPS = [
  // Oficjalna lista zakresów IP (w tym Cron): dokumentacja Vercel — sekcja o adresach IP / cron.
  // Nie hardkoduj na stałe w repo bez procesu aktualizacji; rozważ env CSV lub pobranie przy deployu.
  "76.76.21.0/24",
  // ... pozostałe zakresy z dokumentacji
];

export function autoryzujCron(request: NextRequest): { ok: boolean; powod?: string } {
  const sekret = process.env.CRON_SECRET;
  if (!sekret) return { ok: false, powod: "brak_konfiguracji" };

  const naglowek = request.headers.get("authorization");
  if (naglowek !== `Bearer ${sekret}`) {
    return { ok: false, powod: "nieprawidlowy_token" };
  }

  // Opcjonalnie: walidacja IP w produkcji
  if (process.env.NODE_ENV === "production") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (!ip || !czyIpZVercelCron(ip)) {
      return { ok: false, powod: "ip_spoza_vercel" };
    }
  }

  return { ok: true };
}

function czyIpZVercelCron(ip: string): boolean {
  // implementacja CIDR match
  return VERCEL_CRON_IPS.some((cidr) => ipPasujeDoCidr(ip, cidr));
}
```

**Akceptacja:**
- [x] `curl …/api/automatyzacje/run?secret=…` zwraca `401` (query ignorowany).
- [x] `curl -H "Authorization: Bearer XXX" …` z nieprawidłowym sekretem zwraca `401`.
- [x] Każde poprawne uruchomienie cron (automatyzacje + RSS) zapisuje wiersz do `cron_runs` (przy braku tabeli — błąd tylko w logach serwera do czasu migracji).
- [x] Panel admina (`/panel/admin`) — tabela 50 ostatnich uruchomień + skrócona lista ostatnich błędów (max 10).

### 1.2. Idempotency cronów

**Problem:** Jeśli Vercel Cron uruchomi się dwa razy w krótkim odstępie (zdarza się przy retries), `run_village_automation()` może zarchiwizować rzeczy podwójnie albo wysłać duplikaty powiadomień.

**Stan wdrożenia (2026-05-03):** migracja `20260504160000_cron_idempotencja_blokady.sql`:

- **`run_village_automation_for_cron()`** — `pg_try_advisory_lock(hashtext('naszawies:cron:run_village_automation'))`, wewnątrz tej samej sesji wywołanie `run_village_automation()`, potem `pg_advisory_unlock`. Endpoint `/api/automatyzacje/run` woła **tylko** tę funkcję (service role). Przy zajętej blokadzie jeden wiersz wyniku: `action = skipped_concurrent_lock`, `affected_rows = 0`.
- **RSS** — tabela `cron_lease` + `cron_acquire_lease` / `cron_release_lease` (TTL domyślnie 900 s, w API **2700 s** dla długiego fetcha); przy zajętym lease zwracane `skipped` bez uruchamiania synchronizacji.

**Szkic alternatywny (archiwum — dynamiczny EXECUTE):**

```sql
CREATE OR REPLACE FUNCTION uruchom_z_blokada(
  p_klucz_blokady TEXT,
  p_funkcja_do_uruchomienia TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lock_id BIGINT;
  v_ma_blokade BOOLEAN;
  v_wynik JSONB;
BEGIN
  v_lock_id := hashtext(p_klucz_blokady);
  SELECT pg_try_advisory_lock(v_lock_id) INTO v_ma_blokade;

  IF NOT v_ma_blokade THEN
    RETURN jsonb_build_object('status', 'pominieto', 'powod', 'inny_proces_w_trakcie');
  END IF;

  BEGIN
    EXECUTE format('SELECT to_jsonb(%I())', p_funkcja_do_uruchomienia) INTO v_wynik;
    PERFORM pg_advisory_unlock(v_lock_id);
    RETURN jsonb_build_object('status', 'wykonano', 'wynik', v_wynik);
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_advisory_unlock(v_lock_id);
    RAISE;
  END;
END;
$$;
```

### 1.3. Service role key — review użycia

**Co zweryfikować w kodzie:**
- Wszystkie pliki które importują `SUPABASE_SERVICE_ROLE_KEY` muszą znajdować się w `src/app/api/` lub `src/lib/server/`.
- Żaden plik kliencki ("use client") nie może mieć dostępu.
- Skonfigurować ESLint regułę:

```json
// .eslintrc dodać:
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "@/lib/supabase/admin",
        "message": "Service role może być używane tylko w API routes i Server Actions po stronie serwera."
      }]
    }]
  }
}
```

---

## 2. Spójna warstwa powiadomień (in-app, push, email, SMS)

### 2.1. Problem obecny

Dokument przyznaje że nie ma spójnej dostawy mailowej przy `notifications.insert`. Realny problem: sołtys dodaje ogłoszenie → mieszkaniec dostaje **tylko in-app**, nie wie że coś się stało, dopóki nie wejdzie na stronę.

### 2.2. Rozwiązanie — jeden punkt wejścia

**SQL — nowa migracja `20260601200000_preferencje_powiadomien.sql`:**

```sql
CREATE TYPE kanal_powiadomienia AS ENUM ('in_app', 'push', 'email', 'sms');
CREATE TYPE czestotliwosc_powiadomienia AS ENUM ('natychmiast', 'digest_dzienny', 'digest_tygodniowy', 'wylaczone');

CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  typ_powiadomienia TEXT NOT NULL,
  -- np. 'nowy_post', 'nowa_rezerwacja', 'wniosek_zaakceptowany', 'rss_nowy_wpis', ...

  kanal_in_app czestotliwosc_powiadomienia DEFAULT 'natychmiast',
  kanal_push czestotliwosc_powiadomienia DEFAULT 'natychmiast',
  kanal_email czestotliwosc_powiadomienia DEFAULT 'digest_dzienny',
  kanal_sms czestotliwosc_powiadomienia DEFAULT 'wylaczone',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, typ_powiadomienia)
);

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_notification_preferences_wlasciciel ON user_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Tabela kolejki digest
CREATE TABLE notification_digest_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  kanal kanal_powiadomienia NOT NULL,
  czestotliwosc czestotliwosc_powiadomienia NOT NULL,
  zaplanowane_na TIMESTAMPTZ NOT NULL,
  wyslane_at TIMESTAMPTZ,
  blad TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_digest_zaplanowane ON notification_digest_queue(zaplanowane_na)
  WHERE wyslane_at IS NULL;
```

**Funkcja RPC — jeden punkt wejścia:**

```sql
CREATE OR REPLACE FUNCTION wyslij_powiadomienie(
  p_user_id UUID,
  p_typ TEXT,
  p_tytul TEXT,
  p_tresc TEXT,
  p_link_url TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_pref RECORD;
  v_kanal kanal_powiadomienia;
BEGIN
  -- 1. Zawsze tworzymy in-app (źródło prawdy)
  INSERT INTO notifications (user_id, type, title, body, link_url, related_id, related_type, channel)
  VALUES (p_user_id, p_typ, p_tytul, p_tresc, p_link_url, p_related_id, p_related_type, 'in_app')
  RETURNING id INTO v_notification_id;

  -- 2. Pobierz preferencje (lub default jeśli brak)
  SELECT
    COALESCE(kanal_push, 'natychmiast') AS push,
    COALESCE(kanal_email, 'digest_dzienny') AS email,
    COALESCE(kanal_sms, 'wylaczone') AS sms
  INTO v_pref
  FROM user_notification_preferences
  WHERE user_id = p_user_id AND typ_powiadomienia = p_typ;

  IF NOT FOUND THEN
    v_pref.push := 'natychmiast';
    v_pref.email := 'digest_dzienny';
    v_pref.sms := 'wylaczone';
  END IF;

  -- 3. Push — natychmiast (worker zewnętrzny czyta kolejkę)
  IF v_pref.push = 'natychmiast' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'push', 'natychmiast', NOW());
  END IF;

  -- 4. Email — digest dzienny domyślnie
  IF v_pref.email = 'natychmiast' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'email', 'natychmiast', NOW());
  ELSIF v_pref.email = 'digest_dzienny' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'email', 'digest_dzienny', date_trunc('day', NOW()) + INTERVAL '20 hours');
  ELSIF v_pref.email = 'digest_tygodniowy' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'email', 'digest_tygodniowy', date_trunc('week', NOW()) + INTERVAL '6 days 18 hours');
  END IF;

  -- 5. SMS — tylko jeśli włączone (drogie, ostrożnie)
  IF v_pref.sms = 'natychmiast' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'sms', 'natychmiast', NOW());
  END IF;

  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION wyslij_powiadomienie TO authenticated, service_role;
```

**Uwagi implementacyjne (obowiązkowo przed copy-paste):**

- Blok `SELECT ... INTO v_pref` / przypisania `v_pref.push` w powyższym szkicu są uproszczone — w rzeczowej funkcji rozdziel rekord preferencji od wartości domyślnych (np. osobne `SELECT` + `COALESCE` per kanał), tak aby typy `czestotliwosc_powiadomienia` były spójne z kolumnami `user_notification_preferences`.
- Kolejka `notification_digest_queue` powinna mieć strategię **deduplikacji** (np. unikalny indeks częściowy lub merge digestów per użytkownik i okno czasu), inaczej worker wyśle zduplikowane e-maile przy wielokrotnych insertach.
- Worker po stronie Next.js: rozważ **przetwarzanie z `FOR UPDATE SKIP LOCKED`** (lub równoważnik w Supabase) albo osobny worker z blokadą rozproszoną, aby dwa instancje crona nie brały tych samych wierszy.

**TS — worker w `/api/powiadomienia/dostarcz/route.ts`:**

```typescript
// Cron co 5 minut
export async function GET(req: NextRequest) {
  const auth = autoryzujCron(req);
  if (!auth.ok) return new Response("Unauthorized", { status: 401 });

  const sb = utworzKlientaAdmin();

  const { data: zadania } = await sb
    .from("notification_digest_queue")
    .select("*, notifications(*)")
    .is("wyslane_at", null)
    .lte("zaplanowane_na", new Date().toISOString())
    .limit(100);

  for (const zadanie of zadania ?? []) {
    try {
      if (zadanie.kanal === "push") {
        await wyslijPushDoUzytkownika(zadanie.user_id, zadanie.notifications);
      } else if (zadanie.kanal === "email") {
        await wyslijEmailDigest(zadanie.user_id, zadanie.czestotliwosc);
      } else if (zadanie.kanal === "sms") {
        await wyslijSmsZSmsapi(zadanie.user_id, zadanie.notifications);
      }

      await sb
        .from("notification_digest_queue")
        .update({ wyslane_at: new Date().toISOString() })
        .eq("id", zadanie.id);
    } catch (e) {
      await sb
        .from("notification_digest_queue")
        .update({ blad: String(e) })
        .eq("id", zadanie.id);
    }
  }

  return Response.json({ przetworzono: zadania?.length ?? 0 });
}
```

### 2.3. Email digest — szablon

Mieszkaniec dostaje **jedną mailkę o 20:00** z podsumowaniem dnia z jego wsi:
- 3 nowe ogłoszenia
- 1 nowe wydarzenie (jutro)
- 2 wpisy z BIP gminy
- linki do każdego z nich

To znacznie lepsze niż 6 osobnych maili w ciągu dnia.

**Akceptacja:**
- [ ] `/panel/profil/powiadomienia` pozwala ustawić preferencje per typ.
- [ ] Sołtys dodaje ogłoszenie → 5 minut później wszyscy z `notify_*` mają in-app + push.
- [ ] O 20:00 mieszkaniec dostaje email digest.
- [ ] Można wyłączyć kategorię (np. "RSS z BIP") całkowicie.

---

## 3. RODO — EKSPORT, USUNIĘCIE KONTA, ZGODY

### 3.1. Eksport danych użytkownika (art. 20 RODO)

**Co dodać:** `/panel/profil/moje-dane` z przyciskiem "Pobierz moje dane (JSON)".

**Server Action `eksportujMojeDane`:**

```typescript
"use server";
import { utworzKlientaSerwerowego } from "@/lib/supabase/server";

export async function eksportujMojeDane() {
  const sb = utworzKlientaSerwerowego();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Brak sesji");

  const [profil, role, posty, komentarze, rezerwacje, zgloszenia, powiadomienia, subskrypcjePush] =
    await Promise.all([
      sb.from("users").select("*").eq("id", user.id).single(),
      sb.from("user_village_roles").select("*").eq("user_id", user.id),
      sb.from("posts").select("*").eq("author_user_id", user.id),
      sb.from("comments").select("*").eq("author_user_id", user.id),
      sb.from("hall_bookings").select("*").eq("user_id", user.id),
      sb.from("issues").select("*").eq("reporter_user_id", user.id),
      sb.from("notifications").select("*").eq("user_id", user.id),
      sb.from("user_web_push_subscriptions").select("endpoint, created_at").eq("user_id", user.id),
    ]);

  return {
    metadata: {
      data_eksportu: new Date().toISOString(),
      podstawa_prawna: "Art. 20 RODO - prawo do przenoszenia danych",
      format: "JSON",
    },
    konto: profil.data,
    role_we_wsiach: role.data,
    moje_posty: posty.data,
    moje_komentarze: komentarze.data,
    moje_rezerwacje: rezerwacje.data,
    moje_zgloszenia: zgloszenia.data,
    moje_powiadomienia: powiadomienia.data,
    aktywne_subskrypcje_push: subskrypcjePush.data,
  };
}
```

UI: download jako `moje-dane-naszawies-RRRR-MM-DD.json`.

### 3.2. Usunięcie konta z anonimizacją

**Problem:** Jeśli sołtys usunie konto, wszystkie ogłoszenia wsi znikną → kalendarz wsi w rozsypce. Trzeba **anonimizować**, nie kasować.

**SQL:**

```sql
CREATE OR REPLACE FUNCTION usun_konto_z_anonimizacja(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tylko właściciel konta lub admin
  IF auth.uid() != p_user_id AND NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień';
  END IF;

  -- Anonimizuj posty (zachowaj treść, usuń autora)
  UPDATE posts SET
    author_user_id = NULL,
    author_display_name_snapshot = '[konto usunięte]'
  WHERE author_user_id = p_user_id;

  UPDATE comments SET
    author_user_id = NULL,
    body = '[treść usunięta - konto usunięte przez użytkownika]'
  WHERE author_user_id = p_user_id;

  -- Usuń dane osobowe
  DELETE FROM user_village_roles WHERE user_id = p_user_id;
  DELETE FROM user_follows WHERE user_id = p_user_id;
  DELETE FROM user_web_push_subscriptions WHERE user_id = p_user_id;
  DELETE FROM user_notification_preferences WHERE user_id = p_user_id;
  DELETE FROM notifications WHERE user_id = p_user_id;
  DELETE FROM users WHERE id = p_user_id;

  -- Wpis do audytu
  INSERT INTO audit_log (action, target_user_id, performed_by, performed_at, details)
  VALUES ('konto_usuniete', p_user_id, auth.uid(), NOW(),
          jsonb_build_object('podstawa', 'art. 17 RODO'));

  -- Sam auth.users zostaje skasowany przez trigger lub w drugim kroku przez admina
END;
$$;
```

**UI**: `/panel/profil/usun-konto` z **dwoma stopniami potwierdzenia** + 30-dniowym okresem łaski (kasowanie po cronie po 30 dniach od `requested_at`).

### 3.3. Rejestr zgód

**SQL:**

```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rodzaj_zgody TEXT NOT NULL,
  -- 'regulamin_v1', 'polityka_prywatnosci_v3', 'marketing_email', 'cookies_analityka', 'cookies_marketing'
  wersja TEXT NOT NULL,
  udzielona_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  wycofana_at TIMESTAMPTZ,
  ip_adres INET,
  user_agent TEXT
);

CREATE INDEX idx_user_consents_user ON user_consents(user_id, rodzaj_zgody);
```

Każda zmiana regulaminu = nowa wersja + wymóg ponownej akceptacji przy najbliższym logowaniu.

### 3.4. Cookie banner zgodny z PL/EU

**Wymagania:**
- Banner z **3 osobnymi** zgodami: niezbędne (zawsze), analityka (Plausible — opcjonalne, choć Plausible jest no-cookie), marketing (jeśli będzie).
- Brak pre-checked checkboxes (wyrok TSUE Planet49).
- Możliwość wycofania zgody jednym klikiem (nie zakopane w 5 menu).

**Komponent**: `src/components/zgody/BannerCookies.tsx` z `localStorage` i serwerowym zapisem do `user_consents` po zalogowaniu.

---

## 4. RATE LIMITING, ANTY-SPAM, CAPTCHA

### 4.1. Endpointy do zabezpieczenia priorytetowo

| Endpoint | Limit | Powód |
|---|---|---|
| `POST /api/waitlist` | 3/h/IP | Spam fake-emaili |
| `POST /api/kontakt` | 5/h/IP | Spam botów |
| `POST /api/zglos-naruszenie` | 10/dzień/IP | Nadużywanie systemu zgłoszeń |
| `GET/POST /api/wies/szukaj` | 60/min/IP | Scrapowanie katalogu |
| `POST /logowanie` | 5/15min/IP+email | Brute force |
| `POST /rejestracja` | 3/h/IP | Fake accounts |

### 4.2. Implementacja — Upstash Redis

```bash
npm install @upstash/redis @upstash/ratelimit
```

**`src/lib/rate-limit/index.ts`:**

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const limity = {
  waitlist: new Ratelimit({
    redis, limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true, prefix: "rl:waitlist",
  }),
  kontakt: new Ratelimit({
    redis, limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true, prefix: "rl:kontakt",
  }),
  szukajWies: new Ratelimit({
    redis, limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true, prefix: "rl:szukaj",
  }),
  logowanie: new Ratelimit({
    redis, limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true, prefix: "rl:login",
  }),
};

export async function sprawdzLimit(
  limiter: Ratelimit,
  identyfikator: string
): Promise<{ ok: boolean; remaining: number; resetAt: Date }> {
  const wynik = await limiter.limit(identyfikator);
  return {
    ok: wynik.success,
    remaining: wynik.remaining,
    resetAt: new Date(wynik.reset),
  };
}
```

**Użycie w `/api/waitlist/route.ts`:**

```typescript
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonim";
  const limit = await sprawdzLimit(limity.waitlist, ip);

  if (!limit.ok) {
    return Response.json(
      { blad: "Zbyt wiele zgłoszeń. Spróbuj ponownie za godzinę." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000)) } }
    );
  }
  // ...reszta logiki
}
```

### 4.3. Cloudflare Turnstile (zamiast reCAPTCHA)

**Dlaczego Turnstile a nie reCAPTCHA:**
- Brak ciasteczek śledzących (lepsze RODO).
- Darmowy bez limitu.
- Lepsze UX (najczęściej invisible).
- Nie wymaga zgody na cookie marketingowe.

**Komponenty do zabezpieczenia:** `Rejestracja`, `Kontakt`, `ZglosNaruszenie`, `Waitlist`.

```typescript
// src/components/turnstile/Turnstile.tsx
"use client";
import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";

export function TurnstileWalidator({ onToken }: { onToken: (t: string) => void }) {
  return (
    <TurnstileWidget
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={onToken}
      options={{ language: "pl", theme: "light" }}
    />
  );
}
```

Walidacja serwerowa w `src/lib/turnstile/waliduj.ts`.

---

## 5. GRANICE SOŁECTW NA POSTGIS

### 5.1. Problem obecny

`villages.boundary_geojson` to TEXT/JSONB — niemożliwe są zapytania przestrzenne typu "która wieś zawiera ten punkt?". A masz w roadmapie import PRG z PostGIS — zróbmy to porządnie od razu.

### 5.2. Migracja na natywny PostGIS

**SQL — `20260601300000_postgis_granice_wsi.sql`:**

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- Dodajemy kolumnę natywną geometry obok istniejącej JSONB
ALTER TABLE villages
  ADD COLUMN IF NOT EXISTS boundary_geom geometry(MultiPolygon, 4326),
  ADD COLUMN IF NOT EXISTS centroid_geom geometry(Point, 4326),
  ADD COLUMN IF NOT EXISTS powierzchnia_ha NUMERIC(10, 2);

-- Migracja danych z JSONB do geometry (dla istniejących rekordów)
UPDATE villages
SET boundary_geom = ST_Multi(ST_GeomFromGeoJSON(boundary_geojson::text))
WHERE boundary_geojson IS NOT NULL AND boundary_geom IS NULL;

UPDATE villages
SET
  centroid_geom = ST_Centroid(boundary_geom),
  powierzchnia_ha = ROUND(ST_Area(boundary_geom::geography) / 10000.0, 2)
WHERE boundary_geom IS NOT NULL;

-- Indeksy GIST
CREATE INDEX idx_villages_boundary_gist ON villages USING GIST (boundary_geom);
CREATE INDEX idx_villages_centroid_gist ON villages USING GIST (centroid_geom);

-- Trigger automatycznego wyliczania centroida i powierzchni
CREATE OR REPLACE FUNCTION wylicz_pochodne_geometrii_wsi()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.boundary_geom IS NOT NULL THEN
    NEW.centroid_geom := ST_Centroid(NEW.boundary_geom);
    NEW.powierzchnia_ha := ROUND(ST_Area(NEW.boundary_geom::geography) / 10000.0, 2);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wylicz_geometrie_wsi
  BEFORE INSERT OR UPDATE OF boundary_geom ON villages
  FOR EACH ROW EXECUTE FUNCTION wylicz_pochodne_geometrii_wsi();
  -- Na starszym Postgresie zamiast EXECUTE FUNCTION użyj: EXECUTE PROCEDURE ... (sprawdź wersję w Supabase).
```

### 5.3. RPC: znajdź wieś po współrzędnych

```sql
CREATE OR REPLACE FUNCTION znajdz_wies_po_wspolrzednych(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
) RETURNS TABLE (
  village_id UUID,
  nazwa TEXT,
  slug TEXT,
  url_publiczny TEXT,
  odleglosc_od_centroida_m INT
)
LANGUAGE sql STABLE AS $$
  SELECT
    v.id,
    v.nazwa,
    v.slug,
    '/wies/' || v.wojewodztwo_slug || '/' || v.powiat_slug || '/' || v.gmina_slug || '/' || v.slug,
    ST_Distance(v.centroid_geom::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::INT
    -- Alternatywa: ST_DistanceSphere (starsze API); preferuj geography + ST_Distance w nowszych wersjach PostGIS.
  FROM villages v
  WHERE v.is_active
    AND v.boundary_geom IS NOT NULL
    AND ST_Contains(v.boundary_geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
  LIMIT 1;
$$;
```

**Use case:** Mobilny onboarding — "włącz lokalizację, znajdziemy Twoją wieś".

### 5.4. Tabela cache PRG

```sql
CREATE TABLE prg_cache_obreby_ewidencyjne (
  id BIGSERIAL PRIMARY KEY,
  teryt_jpt TEXT NOT NULL,
  nazwa_obrebu TEXT,
  geom geometry(MultiPolygon, 4326) NOT NULL,
  pobrano_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  zrodlo_url TEXT
);

CREATE INDEX idx_prg_cache_geom ON prg_cache_obreby_ewidencyjne USING GIST (geom);
CREATE INDEX idx_prg_cache_teryt ON prg_cache_obreby_ewidencyjne (teryt_jpt);
```

Worker zaplanowany (cron miesięczny lub on-demand) ściąga PRG z WFS GUGiK do tej tabeli. Następnie sołtys w onboardingu **klika na mapie obręb** → przypisuje go do `villages.boundary_geom`.

### 5.5. Onboarding mapowy (UI)

**Flow:**
1. Sołtys podaje TERYT gminy (autocomplete z TERYT GUS).
2. System pokazuje wszystkie obręby ewidencyjne tej gminy z PRG cache.
3. Sołtys klika obręb (lub wiele) odpowiadający jego sołectwu.
4. System zapisuje wybór jako `boundary_geom`.
5. Trigger automatycznie wylicza centroidę i powierzchnię.

Komponent: `src/app/(site)/rejestracja/wybor-granic-soltectwa/page.tsx` (Leaflet + WMS warstwa PRG).

---

## 6. OBSERWABILITY

### 6.1. Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Konfiguracja `sentry.server.config.ts`:**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV ?? "development",
  ignoreErrors: [
    // Typowe szumy
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
  beforeSend(event) {
    // Nie wysyłaj zdarzeń z localhost
    if (process.env.NODE_ENV === "development") return null;
    // Anonimizuj IP
    if (event.user) event.user.ip_address = undefined;
    return event;
  },
});
```

### 6.2. Tabela audytu z RLS

Dokument wspomina `audit_log` ale nie ma szczegółów. Proponuję:

```sql
-- Już zapewne istnieje, ale dla pewności:
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  -- np. 'wniosek_zaakceptowany', 'rezerwacja_odrzucona', 'post_zatwierdzony'
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_resource_id UUID,
  target_resource_type TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
  details JSONB,
  ip_adres INET,
  user_agent TEXT
);

CREATE INDEX idx_audit_log_village ON audit_log (village_id, performed_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log (performed_by, performed_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log (action, performed_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Sołtys widzi tylko audyt swojej wsi
CREATE POLICY audit_log_soltys ON audit_log
  FOR SELECT USING (
    village_id IS NOT NULL AND is_village_soltys(village_id)
  );

-- Admin platformy widzi wszystko
CREATE POLICY audit_log_admin ON audit_log
  FOR SELECT USING (is_platform_admin());

-- Insert tylko przez SECURITY DEFINER funkcje (nie bezpośrednio)
```

Każda Server Action w `panel/soltys/akcje.ts` powinna kończyć się:

```typescript
await sb.rpc("zapisz_audyt", {
  p_action: "rezerwacja_zaakceptowana",
  p_target_resource_id: rezerwacjaId,
  p_target_resource_type: "hall_booking",
  p_village_id: villageId,
  p_details: { stara_wartosc: ..., nowa_wartosc: ... },
});
```

### 6.3. Health check rozbudowany

`/api/health` powinien zwracać:

```json
{
  "status": "ok",
  "timestamp": "2026-05-04T20:30:00Z",
  "wersja": "1.4.2",
  "zaleznosci": {
    "supabase_db": "ok",
    "supabase_auth": "ok",
    "r2": "ok",
    "resend": "ok"
  },
  "ostatni_cron": {
    "automatyzacje": "2026-05-04T20:00:00Z",
    "rss_sync": "2026-05-04T18:25:00Z"
  }
}
```

Każda zależność testowana z timeoutem 2s. Jeśli któraś `error` → status 503.

---

## 7. BACKUP, DISASTER RECOVERY, RETENCJA

### 7.1. Supabase

**Akcje:**
- Włączyć **Point-in-Time Recovery** (Pro plan, retencja 7 dni).
- Dodać **daily logical backup** do osobnego R2 bucket (skrypt + cron):

```typescript
// scripts/backup-supabase-do-r2.ts
import { exec } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

async function wykonajBackup() {
  const data = new Date().toISOString().split("T")[0];
  const plik = `/tmp/backup-${data}.sql.gz`;

  await new Promise((res, rej) =>
    exec(`pg_dump $DATABASE_URL | gzip > ${plik}`, (err) => err ? rej(err) : res(null))
  );

  const buf = require("fs").readFileSync(plik);
  await r2.send(new PutObjectCommand({
    Bucket: "naszawies-backups",
    Key: `db/${data}.sql.gz`,
    Body: buf,
  }));

  console.log(`Backup ${data} wgrany`);
}
```

### 7.2. R2 — replikacja

Cloudflare R2 ma natywną replikację cross-region (od 2024). Włączyć dla bucketów: `village_photos`, `hall_inventory`, `hall_booking_damage`.

### 7.3. Polityki retencji

| Dane | Retencja | Uzasadnienie |
|---|---|---|
| `notifications` przeczytane | 180 dni (już jest) | Czystość bazy |
| `notifications` nieprzeczytane | 365 dni | Mieszkaniec wraca raz na rok |
| `cron_runs` | 90 dni | Debug |
| `audit_log` | 5 lat | Wymóg prawny dla danych osobowych |
| `cron_locks` | 7 dni | Reset po awarii |
| `notification_digest_queue` wysłane | 30 dni | Debug, raporty |
| `local_news_items` zarchiwizowane | 2 lata | Historyczna wartość |
| `hall_bookings` zakończone | 5 lat | Roszczenia, kaucje |

Dopisać do `run_village_automation()`.

### 7.4. Runbook awarii

`docs/RUNBOOK_AWARII.md`:

```markdown
# Runbook awarii Naszawies.pl

## Scenariusz 1: Supabase DB nie odpowiada (>5 min)

1. Sprawdź status: https://status.supabase.com/
2. Włącz tryb read-only w Vercel:
   - Ustaw env `READ_ONLY_MODE=true` w produkcji
   - Trigger redeploy
3. Pokaż banner "Trwa konserwacja, możesz przeglądać treści ale nie tworzyć nowych".
4. ...

## Scenariusz 2: Vercel down

## Scenariusz 3: R2 niedostępne (zdjęcia nie ładują się)

## Scenariusz 4: Wyciek danych
```

---

## 8. MODERACJA ZGODNA Z DSA

### 8.1. Wymogi DSA dla naszawies.pl

DSA (Digital Services Act, obowiązuje od 2024) dotyczy "internet hosting services". naszawies.pl spełnia tę definicję — przyjmuje treści użytkowników (posty, komentarze, ogłoszenia targowe, blog wsi).

**Wymagania kluczowe:**
1. Mechanizm zgłaszania nielegalnych treści — jest (`/zglos-naruszenie`).
2. Uzasadnienie każdej decyzji moderacyjnej do autora treści.
3. Mechanizm odwołania od decyzji.
4. Roczny raport transparencji (art. 24).
5. Punkt kontaktowy dla władz (art. 11).

### 8.2. Co dodać

**SQL — `20260601400000_dsa_moderacja.sql`:**

```sql
ALTER TABLE moderation_reports
  ADD COLUMN IF NOT EXISTS decyzja TEXT CHECK (decyzja IN ('zatwierdzono_zgloszenie', 'odrzucono_zgloszenie', 'oczekuje', 'eskalowano')),
  ADD COLUMN IF NOT EXISTS uzasadnienie_decyzji TEXT,
  ADD COLUMN IF NOT EXISTS decyzja_podjeta_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decyzja_podjeta_przez UUID REFERENCES auth.users(id);

CREATE TABLE moderation_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES moderation_reports(id) ON DELETE CASCADE,
  appellant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uzasadnienie_odwolania TEXT NOT NULL,
  zlozono_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rozpatrzono_at TIMESTAMPTZ,
  decyzja_odwolawcza TEXT CHECK (decyzja_odwolawcza IN ('uwzglednione', 'oddalone')),
  uzasadnienie_decyzji_odwolawczej TEXT
);

ALTER TABLE moderation_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_appeals_appellant ON moderation_appeals
  FOR SELECT USING (auth.uid() = appellant_user_id);

CREATE POLICY moderation_appeals_admin ON moderation_appeals
  FOR ALL USING (is_platform_admin());
```

### 8.3. Email do autora po decyzji

Autor zgłoszonego posta dostaje email:

```
Temat: Decyzja moderacyjna w sprawie Twojego ogłoszenia

Cześć [imię],

W dniu [data] zgłoszono Twoje ogłoszenie pt. "[tytuł]" na naszawies.pl.

Po analizie naszej moderacji podjęto decyzję: [usunięcie / pozostawienie / edycja].

Uzasadnienie: [tekst]

Masz prawo do odwołania w ciągu 14 dni:
[link do formularza odwołania]

Podstawa prawna: art. 17 DSA, regulamin §X.

Pozdrawiamy,
Zespół naszawies.pl
```

### 8.4. Roczny raport transparencji

`/transparentnosc/RRRR` — strona publiczna z liczbami:
- Liczba zgłoszeń łącznie
- Podział na kategorie (spam, mowa nienawiści, dezinformacja, prawa autorskie, inne)
- Czas median odpowiedzi
- % decyzji uwzględniających zgłoszenie
- Liczba odwołań i ich wyniki

Generowane automatycznie z `moderation_reports` + `moderation_appeals`.

### 8.5. Punkt kontaktowy

`/kontakt-dla-wladz` (art. 11 DSA) — dedykowany adres email + procedura dla policji, prokuratury, sądów. Nie mylić z formularzem dla zwykłych użytkowników.

---

## 9. DOSTĘPNOŚĆ (WCAG 2.1 AA) I UX DLA OSÓB 60+

### 9.1. Dlaczego to ważne

Sołtys to często osoba 50-70 lat. Mieszkaniec wsi czytający tablicę ogłoszeń — często 60+. Jeśli aplikacja nie jest **dostępna**, to nawet z najlepszymi funkcjami nie zostanie używana.

Docelowo warto uwzględnić wytyczne **WCAG 2.2** (nowe kryteria m.in. dla focus i przeciążenia poznawczego), przy czym minimalny próg referencyjny w tym dokumencie pozostaje **WCAG 2.1 poziom AA** (§9.2–9.5).

### 9.2. Audyt obecny

**Do zlecenia:**
1. Przebieg automatyczny: `axe-core` + Lighthouse na każdej kluczowej stronie.
2. Audyt manualny: Tab-only navigation, screen reader (NVDA na Windows, VoiceOver na iOS).
3. Test z realnym użytkownikiem 65+ (rekrutacja przez znajomego sołtysa).

### 9.3. Konkretne rzeczy do dodania

**Tryb wysokiego kontrastu** (`/panel/profil/dostepnosc`):

```typescript
// src/styles/wysoki-kontrast.css
[data-tryb-dostepnosci="wysoki-kontrast"] {
  --kolor-tlo: #000000;
  --kolor-tekst: #FFFFFF;
  --kolor-link: #FFFF00;
  --kolor-przycisk-tlo: #FFFFFF;
  --kolor-przycisk-tekst: #000000;
}
```

**Większy rozmiar czcionki** (3 poziomy: standardowy / duży / bardzo duży) — przełącznik w stopce, zapisany w localStorage.

**Skip links**:

```tsx
<a href="#glowna-tresc" className="skip-link">
  Przejdź do głównej treści
</a>
```

**Aria labels w komponentach** — sprawdzić wszystkie ikony i przyciski-bez-tekstu.

**Focus management** — modale, dropdowny, formularze.

**Komunikaty błędów dla screen readerów** — `aria-live="assertive"` dla błędów krytycznych, `aria-live="polite"` dla potwierdzeń.

### 9.4. Tryb prosty (uproszczony interfejs)

Pomysł: w `/panel/profil/dostepnosc` checkbox "Tryb prosty":
- Większe przyciski.
- Mniej opcji per ekran.
- Pełne zdania zamiast skrótów (np. "Zatwierdź rezerwację świetlicy" zamiast ikona + "Zatwierdź").
- Pomocnicze opisy pod każdym formularzem ("Co to jest? Wpisz tu…").

### 9.5. Deklaracja dostępności (wymóg prawny)

Strona `/deklaracja-dostepnosci` zgodna z wzorem MC: <https://www.gov.pl/web/dostepnosc-cyfrowa/deklaracja-dostepnosci-wzor>

Choć formalnie naszawies.pl nie jest podmiotem publicznym, **gminy będą się integrować** i to staje się argument sprzedażowy + ochrona przed skargami.

---

## 10. TESTY

### 10.1. pgTAP — testy RLS

**Krytyczne!** RLS bez testów to bomba zegarowa. Jeden błąd w polityce → wyciek danych innej wsi.

```bash
# Instalacja w Supabase
CREATE EXTENSION IF NOT EXISTS pgtap;
```

**Przykład: `tests/rls/test-posts.sql`:**

```sql
BEGIN;
SELECT plan(8);

-- Setup: dwie wsie, dwóch sołtysów, jeden mieszkaniec
SELECT seed_test_data();

-- Test 1: Sołtys widzi posty swojej wsi
SET LOCAL "request.jwt.claims" = '{"sub": "soltys-A-uuid"}';
SELECT is(
  (SELECT COUNT(*) FROM posts WHERE village_id = 'wies-A')::INT,
  3,
  'Sołtys A widzi 3 posty wsi A'
);

-- Test 2: Sołtys A NIE widzi postów wsi B
SELECT is(
  (SELECT COUNT(*) FROM posts WHERE village_id = 'wies-B')::INT,
  0,
  'Sołtys A nie widzi postów wsi B'
);

-- Test 3: Mieszkaniec widzi tylko approved
SET LOCAL "request.jwt.claims" = '{"sub": "mieszkaniec-uuid"}';
SELECT is(
  (SELECT COUNT(*) FROM posts WHERE status != 'approved')::INT,
  0,
  'Mieszkaniec widzi tylko approved'
);

-- ... pozostałe testy

SELECT * FROM finish();
ROLLBACK;
```

Uruchomić w CI:

```yaml
# .github/workflows/test-rls.yml
- name: Run pgTAP tests
  run: pg_prove -d "$TEST_DATABASE_URL" tests/rls/*.sql
```

### 10.2. Playwright — flow E2E

**Scenariusze priorytetowe:**

1. **Rejestracja sołtysa → wybór wsi → potwierdzenie → dodanie pierwszego ogłoszenia**.
2. **Rejestracja mieszkańca → wniosek → akceptacja przez sołtysa → mieszkaniec dostaje powiadomienie**.
3. **Rezerwacja świetlicy: mieszkaniec składa → sołtys akceptuje → mieszkaniec dostaje akceptację**.
4. **Zgłoszenie problemu → sołtys widzi w panelu → zmienia status**.
5. **Cookie banner — odmowa cookies analitycznych → Plausible nie ładuje się**.

Struktura: `tests/e2e/scenariusze/` w polskich nazwach plików.

### 10.3. Vitest — testy jednostkowe

Priorytety:
- Wszystkie schematy Zod.
- Helpery walidacji TERYT.
- Logika cron locków.
- Funkcje konwersji granic GeoJSON.

### 10.4. Coverage minimalne

| Obszar | Coverage |
|---|---|
| RLS policies | 90%+ (każda polityka co najmniej 1 test) |
| Server Actions | 70%+ |
| Zod schemas | 100% |
| Pomocnicze utils | 80%+ |

---

## 11. NOWE MODUŁY PRODUKTOWE

### 11.1. Tablica głosowań sołeckich

**Use case:** Sołtys ogłasza głosowanie nad funduszem sołeckim. Mieszkańcy z aktywną rolą głosują. Wynik publiczny po zakończeniu.

```sql
CREATE TABLE village_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  pytanie TEXT NOT NULL,
  opis TEXT,
  utworzone_przez UUID REFERENCES auth.users(id),
  rozpoczyna_sie_at TIMESTAMPTZ NOT NULL,
  konczy_sie_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('zaplanowane', 'aktywne', 'zakonczone', 'anulowane')) DEFAULT 'zaplanowane',
  wymaga_potwierdzenia_mieszkanca BOOLEAN DEFAULT TRUE,
  wynik_publiczny_w_trakcie BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE village_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES village_polls(id) ON DELETE CASCADE,
  tresc TEXT NOT NULL,
  kolejnosc INT NOT NULL DEFAULT 0
);

CREATE TABLE village_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES village_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES village_poll_options(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES auth.users(id),
  oddany_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, voter_user_id)
);

ALTER TABLE village_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_poll_votes ENABLE ROW LEVEL SECURITY;

-- Polityki: tylko aktywni mieszkańcy mogą głosować
-- Tylko sołtys może tworzyć
-- Wyniki widoczne po zakończeniu (lub w trakcie jeśli włączone)
```

### 11.2. Petycje lokalne

```sql
CREATE TABLE village_petitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  tytul TEXT NOT NULL,
  tresc TEXT NOT NULL,
  adresat TEXT NOT NULL, -- np. "Wójt Gminy X"
  zalozona_przez UUID REFERENCES auth.users(id),
  cel_podpisow INT,
  termin_zbiorki TIMESTAMPTZ,
  status TEXT CHECK (status IN ('zbiera_podpisy', 'zlozona', 'odrzucona', 'zrealizowana')),
  wynik_opis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE village_petition_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL REFERENCES village_petitions(id) ON DELETE CASCADE,
  signer_user_id UUID NOT NULL REFERENCES auth.users(id),
  zweryfikowany_mieszkaniec BOOLEAN NOT NULL,
  podpisano_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (petition_id, signer_user_id)
);
```

PDF z listą podpisów (z flagą "zweryfikowany mieszkaniec wsi") generowany przez `html2pdf.js`.

### 11.3. Zbiórki (link out)

Nie implementujemy własnej obsługi płatności. Tylko:
- Sołtys/OSP/parafia tworzy "zbiórkę informacyjną".
- Link out do Zrzutka.pl, PomagamGminie, Pomagam.pl.
- Widget na profilu wsi pokazuje nazwę + krótki opis + link.
- Brak danych płatniczych w naszej bazie.

```sql
CREATE TABLE village_fundraisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  tytul TEXT NOT NULL,
  opis TEXT,
  organizator TEXT, -- "OSP Studzienki", "Parafia św. Jana"
  link_zewnetrzny TEXT NOT NULL,
  platforma TEXT, -- 'zrzutka', 'pomagam', 'siepomaga', 'inna'
  cel_kwota_pln NUMERIC,
  data_zakonczenia DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 11.4. Kalendarz dyżurów sołtysa

```sql
CREATE TABLE soltys_dyzury (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  dzien_tygodnia INT CHECK (dzien_tygodnia BETWEEN 1 AND 7), -- 1=poniedziałek
  godzina_od TIME,
  godzina_do TIME,
  miejsce TEXT, -- "Świetlica", "Dom prywatny", "Telefonicznie"
  uwagi TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
```

### 11.5. Konsolidowany feed wsi

Pytanie z sekcji 18 dokumentu źródłowego: "czy profil wsi powinien mieć jeden skonsolidowany feed?".

**Tak.** Realnie najczęściej odwiedzana strona wsi to "co nowego". Zamiast 8 sekcji, jedna chronologiczna oś czasu z filtrami.

```sql
-- View materialized z odświeżaniem co 15 minut
CREATE MATERIALIZED VIEW wies_feed AS
  SELECT
    'post'::text AS typ,
    p.id,
    p.village_id,
    p.tytul,
    p.tresc AS opis,
    p.created_at AS opublikowano_at,
    p.author_user_id,
    NULL::text AS link_zewnetrzny
  FROM posts p WHERE p.status = 'approved'
  UNION ALL
  SELECT 'blog', b.id, b.village_id, b.tytul, b.tresc, b.opublikowano_at, b.author_user_id, NULL
  FROM village_blog_posts b WHERE b.is_published
  UNION ALL
  SELECT 'wiadomosc_lokalna', n.id, n.village_id, n.tytul, n.streszczenie, n.published_at, NULL, n.zrodlo_url
  FROM local_news_items n WHERE n.status = 'approved'
  UNION ALL
  SELECT 'wydarzenie', e.id, e.village_id, e.tytul, e.opis, e.created_at, e.organizator_user_id, NULL
  FROM village_community_events e WHERE NOT e.is_archived
  ORDER BY opublikowano_at DESC;

CREATE INDEX idx_wies_feed_village ON wies_feed (village_id, opublikowano_at DESC);
```

Cron: `REFRESH MATERIALIZED VIEW CONCURRENTLY wies_feed;` co 15 min.

### 11.6. Moduł rolniczy

Skoro masz w roadmapie IMGW, dodaj wartość dla wsi rolniczych:
- Suma opadów ostatnie 7/30 dni.
- Prognoza zagrożenia gradem (IMGW).
- Kalendarz prac polowych (proste zaznaczanie: "siew jęczmienia jary", "oprysk").
- Tablica wymiany usług ("zaorzę za pole ziemniaków" — proste, bez płatności).

### 11.7. Mapa strażacka / sytuacyjna

Dla OSP — warstwa na mapie publicznej z:
- Hydranty (POI typ "hydrant").
- Studnie.
- Drogi pożarowe.
- Punkty zbiórek przy ewakuacji.

Tylko sołtys/OSP/admin może edytować.

---

## 12. INTEGRACJE Z URZĘDAMI I DANYMI PUBLICZNYMI

### 12.1. BIP gminy — auto-discovery RSS

Większość BIP polskich gmin ma feed RSS (BIP standard). Skrypt:

```typescript
// src/lib/integracje/bip-discovery.ts

const ZNANE_PLATFORMY_BIP = [
  { domena: "bip.gov.pl", patternRss: "/rss/" },
  { domena: "wrotapodlasia.pl", patternRss: "/rss.xml" },
  // ...lista 5-10 platform pokrywa 80%+ gmin
];

export async function odkryjFeedBipDlaGminy(terytGminy: string): Promise<string | null> {
  // 1. Znajdź URL BIP gminy z TERYT (lookup w bazie)
  // 2. Sprawdź typowe ścieżki RSS
  // 3. Zwróć URL lub null
}
```

W onboardingu sołtysa: "Wykryliśmy BIP Twojej gminy: [URL]. Czy włączyć automatyczne pobieranie aktualności?".

### 12.2. Sesje rady gminy z YouTube

Wiele gmin transmituje sesje na YouTube. Add-on:
- Sołtys podaje URL kanału YouTube gminy.
- Cron raz dziennie sprawdza nowe filmy z słowem "sesja" w tytule.
- Auto-tworzy `local_news_items` z embedem.

### 12.3. Dane.gov.pl — datasety przydatne

| Dataset | Zastosowanie |
|---|---|
| TERYT | Walidacja przy rejestracji wsi |
| Rejestr REGON podmiotów | Auto-fill profilu OSP/parafii/firmy |
| Dane budżetowe gmin | Pokazanie ile gmina wydaje na sołectwo |
| Wybory PKW | Frekwencja w sołectwie historycznie |
| Spis rolny GUS | Profil rolniczy wsi (statystyka) |
| Granice GUGiK | Już używane |
| Drogi krajowe GDDKiA | Mapa |

### 12.4. ePUAP / mObywatel — realnie

**ePUAP API** wymaga formalnej umowy z MC (Ministerstwo Cyfryzacji). Realny czas: 6+ miesięcy. Zacząć dopiero przy 100+ aktywnych wsi.

**mObywatel** — jako sposób potwierdzenia tożsamości sołtysa (jest to autoryzowane przez gminę). Integracja przez `Login.gov.pl` (broker). Wymaga formalnego procesu rejestracji jako "podmiot publiczny" — trudne dla startupu.

**Alternatywa**: KIR mojeID lub KIR PayByNet (kosztuje, ale działa od ręki) — komercyjne usługi potwierdzania tożsamości w bankach. Sołtys loguje się przez bank → wiemy że to on z imienia/nazwiska/adresu.

### 12.5. CEIDG / KRS

Reprezentant podmiotu (firma lokalna) → możliwość auto-fill z REGON lub KRS API.

---

## 13. MONETYZACJA BEZ PŁATNOŚCI ONLINE

### 13.1. Modele do rozważenia

| Model | Płatnik | Kwota miesięczna | Trudność |
|---|---|---|---|
| Subskrypcja sołtysa | Sołtys | 0 zł (free) lub 19 zł (pro) | Niska |
| Subskrypcja gminy | Gmina | 200-500 zł | Średnia (przetargi) |
| Reklama lokalnych firm | Firmy | 50-150 zł | Niska |
| Featured listing targowy | Mieszkaniec | 5-10 zł / ogłoszenie | Niska |
| Licencja dla MSWiA / urzędu wojewódzkiego | Państwo | duży kontrakt | Wysoka |
| Sponsoring wsi przez bank/ubezpieczyciela | Korporacja | różnie | Średnia |

### 13.2. Plan minimum: tier "Wieś Plus"

Free: wszystko obecne.

Plus (gmina lub sołtys płaci 49 zł / mc):
- Wyższy limit POI na mapie.
- Eksport danych do CSV (np. lista mieszkańców do drukowania).
- Branding: logo wsi/gminy w hero.
- Brak "Wsparte przez naszawies.pl" w stopce.
- SLA email support 24h.

```sql
ALTER TABLE villages
  ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'enterprise')),
  ADD COLUMN tier_aktywny_do DATE,
  ADD COLUMN sponsor_nazwa TEXT,
  ADD COLUMN sponsor_logo_url TEXT;
```

### 13.3. Faktury — Fakturownia

Najprostsza integracja: Fakturownia.pl API. Sołtys/gmina płaci tradycyjnym przelewem, manualne wystawianie faktury przez admina (na początek), automatyzacja później.

---

## 14. ONBOARDING SOŁTYSA

### 14.1. Mapa pułapek

Sołtys 55+ rejestrujący się sam **rzucą po 3 minutach** jeśli:
- Coś jest niejasne.
- Email nie przyszedł od razu.
- Nie ma do kogo zadzwonić.

### 14.2. Konkretne zmiany

**1. Video onboarding** (3 min, wykonany przez aktora 50+, wieś realna).
Umieszczony:
- Na `/rejestracja` przed formularzem.
- W mailu potwierdzającym.
- W panelu sołtysa po pierwszym logowaniu.

**2. "Konsjerż" — telefon**
Dedykowana godzina (np. 18:00-20:00 wt/czw) — sołtys może zadzwonić. Numer w mailu, na stronie kontaktowej, na potwierdzeniu.

**3. Asystent w panelu**
Po pierwszym logowaniu pojawia się sidebar "Co dalej?":
- ✅ Konto utworzone.
- ⏳ Uzupełnij profil wsi (krótka wiosna ulic, ludność).
- ⏳ Wybierz granice na mapie.
- ⏳ Dodaj pierwszego mieszkańca (wyślij link).
- ⏳ Dodaj pierwsze ogłoszenie.

Każdy krok = jasna instrukcja, video opcjonalne.

**4. Dwa sposoby weryfikacji sołtysa**
A) **Skan dokumentu** (np. uchwały rady gminy o wyborze sołtysa) — manualna weryfikacja przez admina.
B) **Weryfikacja przez wójta/sekretarza gminy** — sołtys wpisuje email gminy, gmina dostaje link "potwierdź że [imię] jest sołtysem [wsi]".

Bez weryfikacji konto działa, ale w panelu publicznym wyświetla się "⚠️ niezweryfikowany sołtys".

**5. Demo wsi**
Sołtys może najpierw kliknąć "zobacz przykładową wieś" (np. Studzienki demo) i dopiero potem zarejestrować się. Sprzedaje produkt.

### 14.3. Komunikacja z sołtysem po rejestracji

| Kiedy | Co | Kanał |
|---|---|---|
| 0h (po rejestracji) | Mail powitalny + video | Email |
| 24h | Sprawdzamy czy uzupełnił profil. Nie? Pomocna mailka. | Email |
| 3 dni | Newsletter z pomysłami "co możesz zrobić w pierwszym tygodniu" | Email |
| 7 dni | Telefon z konsjerża (jeśli nie aktywny) | Telefon |
| 14 dni | Mail z innymi sołtysami w gminie ("Twoi sąsiedzi już są") | Email |
| 30 dni | Ankieta NPS | Email |

---

## 15. DROBNE POPRAWKI TECHNICZNE

### 15.1. Wersjonowanie API

Migracja z `/api/...` do `/api/v1/...`. Stare endpointy rewrite na nowe na rok. Potem deprecation warning w response header. Po 18 miesiącach wyłączenie.

### 15.2. Backoff dla cron RSS

Obecnie cron RSS leci co 6h dla każdego kanału. To dużo. Lepiej:

```sql
ALTER TABLE village_news_feed_sources
  ADD COLUMN nastepne_pobranie_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN interwal_pobierania_minut INT DEFAULT 360,
  ADD COLUMN liczba_kolejnych_bledow INT DEFAULT 0,
  ADD COLUMN ostatnia_zmiana_tresci_at TIMESTAMPTZ;
```

Logika:
- Jeśli ostatnie 5 fetchy nie przyniosło zmian → zwiększ interwał ×2 (max 24h).
- Jeśli pojawiła się zmiana → resetuj do 6h.
- Jeśli błąd pobierania → backoff exponential (60min, 120min, 240min, ...).

Endpoint cron czyta tylko te z `nastepne_pobranie_at <= NOW()`.

### 15.3. ESLint dla przypadkowych ujawnień

```json
{
  "rules": {
    "no-restricted-syntax": ["error", {
      "selector": "ImportDeclaration[source.value='@/lib/supabase/admin']",
      "message": "Klient admin tylko po stronie serwera (nie w 'use client')."
    }]
  }
}
```

### 15.4. Manifest PWA — lepsza obsługa iOS

`apple-touch-icon` i `apple-mobile-web-app-status-bar-style` w `<head>` (Next.js metadata API).

### 15.5. Sitemap — paginacja

Obecnie limit 800 wsi w sitemap. Gdy dojdziesz do 50 000 wsi (ambitnie), podziel na sitemapy:

```
/sitemap.xml → sitemap index
/sitemap-strony.xml → strony statyczne
/sitemap-wsie-1.xml → wsie 1-10000
/sitemap-wsie-2.xml → wsie 10001-20000
```

### 15.6. CSP (Content Security Policy)

Brak wzmianki o CSP w dokumencie. Dodać w `next.config.js`:

```javascript
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://plausible.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.r2.cloudflarestorage.com https://*.tile.openstreetmap.org;
  connect-src 'self' https://*.supabase.co https://api.resend.com wss://*.supabase.co;
  frame-src https://challenges.cloudflare.com https://www.youtube.com;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, " ");
```

### 15.7. CORS — strict default

API routes powinny mieć restrykcyjne CORS:

```typescript
function ustawCors(req: NextRequest, response: Response): Response {
  const origin = req.headers.get("origin");
  const dozwolone = ["https://naszawies.pl", "https://www.naszawies.pl"];
  if (origin && dozwolone.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  return response;
}
```

### 15.8. 404 / 500 strony

Sprawdzić czy są spersonalizowane (`app/not-found.tsx`, `app/error.tsx`). Pokazać przyciski "Wróć do mapy / Wróć do swojej wsi / Skontaktuj się".

### 15.9. Indeksy które mogą się przydać

Bez znajomości pełnego schematu, ale typowe:

```sql
-- Posty wsi po typie i statusie
CREATE INDEX idx_posts_village_type_status ON posts (village_id, type, status, created_at DESC);

-- Notyfikacje nieprzeczytane (selectywny)
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, created_at DESC)
  WHERE is_read = FALSE;

-- Rezerwacje sali w okresie
CREATE INDEX idx_hall_bookings_period ON hall_bookings (hall_id, start_at, end_at)
  WHERE status IN ('approved', 'pending');

-- User village roles aktywne
CREATE INDEX idx_uvr_active ON user_village_roles (village_id, role)
  WHERE status = 'active';
```

### 15.10. Storage — naming convention

Zdjęcia powinny mieć randomized nazwy + prefix wsi. Inaczej user zgaduje URL i widzi cudze zdjęcia (jeśli polityki R2 nie są szczelne).

```typescript
const nazwaPliku = `${villageId}/${crypto.randomUUID()}.${rozszerzenie}`;
```

---

## 16. BRAKUJĄCE SEKCJE W DOKUMENTACJI PRODUKTU

Dokument źródłowy jest świetny technicznie, ale brakuje sekcji potrzebnych dla AI/inwestorów/zespołu.

### 16.1. Persona i job-to-be-done

**Sołtyska Anna, 58 lat, Studzienki (woj. mazowieckie)**
- 320 mieszkańców.
- Sołtys 4 rok kadencji.
- Komputer w domu (Windows), używa WhatsApp, Facebook (czasem), email.
- Drukuje ogłoszenia na A4, przybija na tablicy przy świetlicy + Kościele.
- Zwołuje zebrania przez telefon i przez parafię.
- Job-to-be-done: "Chcę informować mieszkańców o zebraniu / awarii wody / festynie bez chodzenia od domu do domu i bez gubienia się w grupie WhatsApp".

**Mieszkaniec Tomek, 42 lata, dojeżdża do pracy w mieście**
- Wraca o 19:00, nie ma czasu na tablice.
- Job-to-be-done: "Chcę wiedzieć o awariach prądu/wody w mojej wsi przez telefon, zanim wrócę do domu".

### 16.2. Konkurencja

| Konkurent | Zalety | Wady | Naszawies edge |
|---|---|---|---|
| Facebook Group "Mieszkańcy Studzienki" | Każdy ma FB | Algorytm chowa posty, brak struktury | Stałe URL, kalendarz świetlicy, RODO-friendly |
| WhatsApp grupa | Szybkie | Limit 1024 osób, brak archiwum | Public profile dla nowych mieszkańców |
| eSołectwo | Oficjalna integracja gminy | Zamknięty SaaS dla gmin, drogi | Mieszkaniec ma realny panel, nie tylko gmina |
| Sołectwo+ | Podobna idea | Nieaktywny? | Lepsza dostępność, PWA |
| Strona statyczna gminy | Oficjalna | Aktualizowana raz na pół roku | Sołtys aktualizuje sam |

### 16.3. Metryki sukcesu

**Aktywacja:**
- % sołtysów którzy w 7 dni dodali pierwsze ogłoszenie.
- % wsi które w 30 dni mają 5+ aktywnych mieszkańców.

**Retencja:**
- % sołtysów aktywnych w 30, 90, 180 dniach.
- DAU/MAU (powyżej 30% to dobry znak community).

**Wartość:**
- Średnia liczba ogłoszeń na wieś / miesiąc.
- Średnia liczba rezerwacji świetlicy / miesiąc.
- Średnia liczba zgłoszeń problemów / miesiąc.

**Reach:**
- Liczba wsi.
- Liczba zarejestrowanych mieszkańców.
- Liczba unikalnych odwiedzin profili publicznych.

**NPS** (kwartał).

### 16.4. Stack decyzji architektonicznych (ADR)

W repo `docs/adr/`:

```
0001-dlaczego-supabase-zamiast-firebase.md
0002-dlaczego-server-actions-zamiast-rest.md
0003-dlaczego-r2-zamiast-s3.md
0004-dlaczego-postgis-zamiast-jsonb-dla-granic.md
0005-dlaczego-turnstile-zamiast-recaptcha.md
0006-dlaczego-resend-zamiast-postmark.md
0007-dlaczego-smsapi-pl-zamiast-twilio.md
0008-dlaczego-cron-vercel-zamiast-supabase-scheduled-functions.md
```

Format każdego ADR (Architecture Decision Record):

```markdown
# 0001 - Dlaczego Supabase a nie Firebase

## Status
Zaakceptowane (2025-12-01)

## Kontekst
Potrzebowaliśmy backend-as-a-service z auth, storage, db.

## Decyzja
Supabase.

## Konsekwencje
+ Postgres (RLS, PostGIS, dojrzałość)
+ Pełny SQL
+ Open source
- Mniej dojrzała mobilna SDK (iOS/Android)
- Mniejszy ekosystem niż Firebase

## Alternatywy rozważane
- Firebase: ...
- Własny stack (Postgres + custom auth): ...
- AWS Amplify: ...
```

### 16.5. Polityka bezpieczeństwa (security.md)

`/.well-known/security.txt` + `SECURITY.md` w repo:

```
Contact: mailto:security@naszawies.pl
Expires: 2027-01-01T00:00:00.000Z
Acknowledgments: https://naszawies.pl/bezpieczenstwo/podziekowania
Preferred-Languages: pl, en
Canonical: https://naszawies.pl/.well-known/security.txt
Policy: https://naszawies.pl/polityka-bezpieczenstwa
```

### 16.6. Polityka cookies + lista trackerów

`/polityka-cookies` z **konkretną** listą:
- Niezbędne: sb-access-token, sb-refresh-token (Supabase auth) — bez nich nie zalogujesz się.
- Analityka: Plausible (no-cookie domyślnie, więc nawet nie potrzebne).
- Marketing: brak.

### 16.7. Compliance map

```markdown
# Compliance Map - naszawies.pl

| Regulacja | Status | Dowód |
|---|---|---|
| RODO (eksport, usunięcie, zgody) | ⏳ W trakcie | sekcja 3 roadmap |
| DSA (moderacja, transparency) | ⏳ Q3 2026 | sekcja 8 roadmap |
| Ustawa o świadczeniu usług drogą elektroniczną | ✅ | regulamin |
| Ustawa o dostępności cyfrowej | ⚠️ Częściowo | audyt WCAG zaplanowany |
| Ustawa o prawach konsumenta | N/D | brak sprzedaży konsumenckiej |
```

---

## 17. PLAN WDROŻENIA

### Sprint 1 (2 tygodnie) — fundament bezpieczeństwa
- [x] 1.1 Cron auth Bearer-only + tabela `cron_runs` + zapis z API + podgląd w panelu admina
- [x] 1.2 Idempotency cronów (advisory lock + lease RSS, migracja `20260504160000`)
- [x] 1.3 ESLint: `no-restricted-imports` dla `@/lib/supabase/admin-client` w `*.tsx`
- [x] 4.1-4.2 Rate limiting (Upstash) — **waitlist, kontakt, zgłos-naruszenie, wies/szukaj** (logowanie/rejestracja: formularze stron, osobno)
- [x] 4.3 Cloudflare Turnstile — waitlist (landing), kontakt, zgłoszenie naruszenia (+ walidacja API)
- [x] 6.1 Sentry — szkielet SDK (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`, upload map wyłączony domyślnie)
- [ ] 15.6 CSP headers

### Sprint 2 (2 tygodnie) — RODO
- [ ] 3.1 Eksport danych
- [ ] 3.2 Usunięcie konta z anonimizacją
- [ ] 3.3 Tabela `user_consents` + wymóg ponownej akceptacji przy zmianie regulaminu
- [ ] 3.4 Cookie banner zgodny z PL/EU
- [ ] 16.5 security.txt
- [ ] 16.6 Lista trackerów

### Sprint 3 (3 tygodnie) — powiadomienia
- [ ] 2.2 Tabele preferencji + `wyslij_powiadomienie` RPC
- [ ] 2.3 Worker digest + integracja z istniejącymi akcjami
- [ ] Migracja wszystkich `notifications.insert` na `wyslij_powiadomienie`
- [ ] UI `/panel/profil/powiadomienia`

### Sprint 4 (2 tygodnie) — PostGIS i mapy
- [ ] 5.2 Migracja na `geometry`
- [ ] 5.3 RPC `znajdz_wies_po_wspolrzednych`
- [ ] 5.4 Cache PRG
- [ ] 5.5 Onboarding mapowy

### Sprint 5 (2 tygodnie) — dostępność
- [ ] 9.2 Audyt WCAG (zewnętrzny)
- [ ] 9.3 Tryb wysokiego kontrastu, większa czcionka, skip links
- [ ] 9.4 Tryb prosty
- [ ] 9.5 Deklaracja dostępności

### Sprint 6 (2 tygodnie) — testy
- [ ] 10.1 pgTAP dla wszystkich tabel z RLS
- [ ] 10.2 Playwright dla 5 scenariuszy priorytetowych
- [ ] CI/CD z testami

### Sprint 7-8 (4 tygodnie) — DSA + moderacja
- [ ] 8.2-8.5 Pełny moduł DSA

### Sprint 9-10 (4 tygodnie) — nowe moduły
- [ ] 11.1 Tablica głosowań
- [ ] 11.2 Petycje
- [ ] 11.4 Kalendarz dyżurów sołtysa
- [ ] 11.5 Konsolidowany feed

### Sprint 11+ — onboarding, integracje, monetyzacja
- [ ] 14 Pełny onboarding sołtysa (video, konsjerż, asystent)
- [ ] 12.1 BIP auto-discovery
- [ ] 13.2 Tier "Plus"

**Orientacja czasowa (nie sztywny deadline):** Sprinty 1–2 jako **Q2 2026**, 3–6 jako **Q2–Q3 2026**, DSA i moduły ciężkie **Q3–Q4 2026** — dopasuj do zespołu i obciążenia supportu po starcie gmin.

---

## 18. RYZYKA, ZAŁOŻENIA, HISTORIA ZMIAN

### 18.1. Ryzyka realizacyjne

| Ryzyko | Skutek | Mitygacja |
|--------|--------|-----------|
| IP allowlist dla crona oparta tylko o `X-Forwarded-For` | Fałszywe odrzucenia lub zbyt luźna kontrola | Traktuj allowlist jako **dodatek** do `Authorization: Bearer`; weryfikuj nagłówki pod Vercel; rozważ `vercel.json` z `crons` + sekret tylko w nagłówku. |
| `SECURITY DEFINER` bez twardej listy uprawnień | Eskalacja uprawnień | Każda funkcja SD: minimalne `GRANT`, audyt wywołań, test RLS/pgTAP. |
| Upstash / Turnstile / Sentry jako nowe vendor lock-in | Koszt i złożoność operacyjna | Zacznij od środowiska staging; jedna osoba „właściciel integracji” na usługę. |
| Digest e-mail + worker w Vercel | Duplikaty, timeout 10s, limity Resend | Kolejka po stronie DB z `SKIP LOCKED`, batch mniejszy niż limit czasu, retry z backoff. |
| PostGIS na Supabase | Większy rozmiar backupów, migracja długa | Najpierw kolumna równoległa do GeoJSON, indeks `CONCURRENTLY`, monitoring po wdrożeniu. |

### 18.2. Założenia planu

- Nadal obowiązuje model **jedna wieś = `village_id`**, treści modułowe z RLS per wieś.
- **Service role** pozostaje wyłącznie na serwerze (Edge/API Routes/Server Actions bez eksportu do klienta).
- Integracje ePUAP / mObywatel (§12.4) są **świadomie odłożone** do fazy skalowania — nie blokują sprintów 1–3.

### 18.3. Historia zmian dokumentu

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | (wcześniej) | Pierwsza kompletna wersja sekcji 1–17 i załączników A–B. |
| 1.1 | 2026-05-03 | §0 stan vs kod, §18 ryzyka i historia, metadane tabelą, uwagi do SQL/workerów, VAPID w załączniku A, orientacja sprintów, rozszerzona lista kontrolna. |
| 1.2 | 2026-05-03 | §19 jednostki publiczne; realizacja części Sprintu 1 w kodzie (cron Bearer, `cron_runs`, ESLint admin); checklista §1.1/§17; poprawka `uruchomAutomatyzacjeWsi` (weryfikacja roli sołtysa względem `villageId`). |
| 1.3 | 2026-05-03 | §1.2 w kodzie: `run_village_automation_for_cron`, `cron_lease` + lease RSS; `/api/health` rozszerzony; `X-Content-Type-Options: nosniff` w `next.config.mjs`. |
| 1.4 | 2026-05-03 | Rate limiting Upstash dla publicznych API (`src/lib/rate-limit/…`); `odczytaj-adres-ip` współdzielony. |
| 1.5 | 2026-05-03 | Turnstile (formularze + API + landing); Sentry (`@sentry/nextjs`, `instrumentation`, `global-error`). |

---

## 19. JEDNOSTKI PUBLICZNE I WSPÓŁPRACA Z GMINĄ

### 19.1. Cel

Przy rozmowach z **gminą** lub **UR** potrzebny jest jasny podział: co robi portal sołecki (naszawies.pl), a co pozostaje w BIP / ePUAP / systemach gminnych — bez obietnic integracji, których zespół nie może utrzymać.

### 19.2. Pakiet „minimum formalne”

| Element | Opis |
|---------|------|
| Kontakt dla władz | Strona / adres zgodnie z §8.5 planu (DSA), osobno od formularza mieszkańców. |
| RODO | Eksport, usunięcie, zgody (§3) — argument przy przetwarzaniu danych mieszkańców. |
| Dostępność | Deklaracja + realne działania WCAG (§9) — często wymóg lub oczekiwanie przy współfinansowaniu. |
| Bezpieczeństwo | Cron, rate limit, audyt (§1, §4, §6) — krótki **security one-pager** dla IT gminy na żądanie. |

### 19.3. Model danych z perspektywy gminy

- Gmina **nie musi** być „tenantem” technicznym w bazie od pierwszego dnia: wystarczy powiązanie WSI z `teryt_id` / jednostką już istniejące w `villages`.
- Ewentualny **panel read-only dla urzędu** (lista wsi w gminie, statystyki zgłoszeń) — osobna epika po 50+ aktywnych wsiach; tu tylko zarezerwowana nazwa produktowa („Gmina widzi”).

### 19.4. Czego nie obiecywać na start

- Integracja **ePUAP** / **mObywatel** bez podpisanej umowy i budżetu (por. §12.4).
- „Pełna synchronizacja z BIP” — realnie: RSS / linki (§12.1), a nie crawl całej struktury HTML każdej gminy.

---

## ZAŁĄCZNIK A: zmienne środowiskowe do dodania

```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Upstash Redis (rate limit)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# SMSAPI (gdy będzie SMS)
SMSAPI_TOKEN=
SMSAPI_FROM=NaszaWies

# Backup
BACKUP_R2_BUCKET=naszawies-backups

# Wersja
NEXT_PUBLIC_WERSJA_APLIKACJI=1.4.2

# Tryb dla disaster recovery
READ_ONLY_MODE=false

# Web Push (już używane przy subskrypcjach w DB — uzupełnij jeśli włączone)
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
# VAPID_SUBJECT=mailto:kontakt@naszawies.pl
```

## ZAŁĄCZNIK B: priorytetyzacja - macierz wartość/wysiłek

| Zadanie | Wartość | Wysiłek | Priorytet |
|---|---|---|---|
| Cron Bearer-only + `cron_runs` | Wysoka (security) | Niski (1 dzień) | **Częściowo zrobione** |
| Rate limiting (Upstash, kluczowe API) | Wysoka (security) | Niski | **Wdrożone (wymaga env)** |
| Eksport danych RODO | Wysoka (prawo) | Średni (3 dni) | Sprint 1-2 |
| Usunięcie konta z anon. | Wysoka (prawo) | Średni (3 dni) | Sprint 1-2 |
| Powiadomienia email digest | Bardzo wysoka (UX) | Wysoki (10 dni) | Sprint 3 |
| PostGIS migracja | Wysoka (technical debt) | Średni (5 dni) | Sprint 4 |
| Audyt dostępności | Wysoka (UX, sprzedaż gminom) | Wysoki (zewnętrzny) | Sprint 5 |
| pgTAP RLS testy | Krytyczna (security) | Wysoki (8 dni) | Sprint 6 |
| DSA pełny | Wysoka (prawo) | Wysoki (12 dni) | Sprint 7-8 |
| Tablica głosowań | Średnia (nice-to-have) | Średni (5 dni) | Sprint 9 |
| Onboarding video + konsjerż | Krytyczna (aktywacja) | Średni (8 dni) | Sprint 11 |
| BIP auto-discovery | Średnia | Wysoki (10 dni) | Sprint 12 |

---

## KONIEC DOKUMENTU

Sprint 1 i 2 są blokerem dla każdego dalszego skalowania. Reszta może iść równolegle przez różnych ludzi.

**Pytania kontrolne przy implementacji (rozszerzone):**

1. Czy zaimplementowane RLS pokrywa wszystkie ścieżki dostępu (w tym odczyty przez joiny i widoki)?
2. Czy nowa kolumna ma indeks tam, gdzie występuje w `WHERE` / `ORDER BY` / kluczach obcych?
3. Czy Server Action ma wpis do `audit_log` (gdy akcja ma skutek prawny lub moderacyjny)?
4. Czy ścieżka `/api/...` ma rate limiting i sensowny komunikat `429` z `Retry-After`?
5. Czy nowy formularz publiczny ma walidację Zod + (tam gdzie uzasadnione) Turnstile?
6. Czy nowy moduł ma test Playwright dla happy path albo pgTAP dla polityk RLS?
7. Czy migracja jest idempotentna (`IF NOT EXISTS`, bezpieczny `ALTER`, `ON CONFLICT` tam gdzie trzeba)?
8. Czy zmiana w `auth.users` / `users` jest zsynchronizowana z anonimizacją i eksportem RODO (§3)?
9. Czy logi i Sentry **nie zawierają** PII ani pełnych tokenów (przykłady w §6.1)?

**Powiązane pliki w repo:** `naszawies/OPIS_APLIKACJI_DO_ANALIZY_AI.txt`, migracje `naszawies/supabase/migrations/`, niniejszy `docs/Extra/PLAN_ROZWOJU_STRONY_WSI.md`.

