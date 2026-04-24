# Plan sali świetlicy w naszawies (wdrożone w tym repozytorium)

> W katalogu **`docs/`** nie ma osobnej „paczki planera 3D” — to **ten plik** opisuje, co **faktycznie** jest w kodzie `naszawies/`.  
> Osobna, rozbudowana specyfikacja **izometrycznego planera 3D** (React Three Fiber, presety bankiet/U/teatr) żyje w pakiecie poza tym folderem, patrz sekcja [Dokumentacja zewnętrzna](#dokumentacja-zewnętrzna).

## Co działa dziś (MVP 2D)

- **Sołtys** w panelu sali (`/panel/soltys/swietlica/[hallId]`) ma edytor **2D** (`PlanSaliEdytor`): dodawanie stołów (prostokątny / okrągły, ławka), przeciąganie, obrót, wymiary, zapis do bazy.
- **Mieszkaniec** na stronie tej samej sali w swoim panelu widzi **tylko odczyt** planu (`PlanSaliRysunek`) — schemat ustawiony przez sołtysa.
- Plan jest trzymany w kolumnie JSONB **`halls.layout_data`**; walidacja i typy w `src/lib/swietlica/plan-sali.ts` (Zod, wersja schematu `wersja: 1`).
- **Dokument wynajmu** (sołtys / mieszkaniec) może dołączać plan jako rysunek, jeśli dane są w `layout_data` — logika w `pobierz-dane-dokumentu-wynajmu.ts` + `PlanSaliRysunek` w widoku dokumentu.

## Główne pliki w repozytorium

| Rola | Ścieżka |
|------|---------|
| Model JSON, parsowanie, pusty plan | `src/lib/swietlica/plan-sali.ts` |
| Edytor 2D (sołtys) | `src/components/swietlica/plan-sali-edytor.tsx` |
| Rysunek SVG (podgląd / PDF / dokument) | `src/components/swietlica/plan-sali-rysunek.tsx` |
| Zapis planu (server action) | `src/app/(site)/panel/soltys/akcje.ts` — `zapiszPlanSali` |
| Strona z edytorem | `src/app/(site)/panel/soltys/swietlica/[hallId]/page.tsx` |
| Strona z podglądem dla mieszkańca | `src/app/(site)/panel/mieszkaniec/swietlica/[hallId]/page.tsx` |

## Format `layout_data` (skrót)

- `wersja`: `1`
- `szerokosc_sali_m`, `dlugosc_sali_m` — opcjonalnie, do podpisu na rysunku
- `elementy[]`: każdy element ma `id` (UUID), `typ` (`stol_prostokatny` \| `stol_okragly` \| `lawka` \| `inne`), pozycję `x`/`y` w skali **0–100%** powierzchni, rozmiar `szer`/`wys`, `obrot`, `etykieta`, opcjonalnie `miejsca`, wymiary cm

Pełne ograniczenia w `schemaPlanSali` w `plan-sali.ts`.

## Czym to **nie** jest

- **Nie** jest to jeszcze planer 3D z `Cloude Docs/naszawies-killer-feature` (R3F, sztuczne ściany drzwi, presety bankiet w jednym kliknięciu, PDF z rezerwacją w jednym flow).
- **Strona „Studzienki — projekt świetlicy”** (`studzienki-*.tsx`) to marketingowy / dokumentacyjny rzut (PNG + warstwa interaktywna). **Świetlica w Studzienkach** w bazie ma `layout_data` spójne z tym szkicem: `UKLAD_STOLOW_W_SALI_STUDZIENKI` w `studzienki-rzut-dane.ts` mapuje się do planu 100×70 w `plan-sali-studzienki-seed.ts` (migracja `20260430210000_studzienki_hall_layout_data.sql`).

## Dokumentacja zewnętrzna

- **Killer feature (3D, pełna spec):** w workspace: `Cloude Docs/naszawies-killer-feature/docs/PLANER-SWIETLICY.md`
- **Funkcje produktu (opis):** `Cloude Docs/naszawies-package/docs/FEATURES.md` (sekcja planera)
- **Roadmap:** `Cloude Docs/naszawies-package/ROADMAP.md` (Faza 2 — interaktywny planer)

## Dalsze kroki (jeśli rozbudowa)

1. Integracja planu z **formularzem rezerwacji** (np. zapis układu wybranego przez mieszkańca) — w MVP rezerwacja i plan sali to osobne ścieżki danych.
2. Ewentualne **presety 2D** (bankiet / U) generujące elementy w `elementy[]` — bez 3D, tylko matematyka na procentach.
3. Dopiero potem import komponentów **3D** zgodnie z `PLANER-SWIETLICY.md` w pakiecie killer-feature.

---

*Ostatnia aktualizacja opisu względem kodu: 2026-04 (edytor 2D + `layout_data`).*
