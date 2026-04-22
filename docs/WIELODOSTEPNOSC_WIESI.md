# Wielodostępność: jedna wieś jak „osobna baza”

## Idea

W **jednej** instancji PostgreSQL (Supabase) trzymamy wszystkie wsie. **Nie** tworzymy osobnej bazy na wieś — za to **każda tabela domenowa** ma kolumnę `village_id` (albo łączy się przez tabelę potomną, np. `hall_bookings` → `halls` → `village_id`).

To daje:

- jedną migrację, jeden backup, jedno RLS;
- izolację danych na poziomie wiersza (RLS: `is_village_resident`, `is_village_soltys`).

## Co jest „tylko we wsi”

Przykłady: zwykłe **ogłoszenia**, **zebrania**, **awarie**, **rezerwacje świetlicy** (lista sal dla zalogowanych gości tylko w aktywnych wsiach — patrz RLS), **zgłoszenia** (`issues`), treści tylko dla mieszkańców.

Reguła w aplikacji: zapisuj jako `posts.type` inny niż `targ_lokalny` (np. `ogloszenie`, `wydarzenie`). Polityki RLS pozwalają wtedy na odczyt osobom z rolą we wsi lub sołtysowi.

## Targ lokalny — widoczny dla „wszystkich, co wejdą”

Oferty kupna/sprzedaży/wymiany na stronie wsi mają być widoczne **bez bycia mieszkańcem** (np. sąsiad z innej wsi, rodzina, turysta z linkiem).

W bazie:

- typ posta: **`targ_lokalny`** (enum `post_type`);
- po zatwierdzeniu (`status = 'approved'`) **każdy** może czytać ten wiersz (w tym `anon` z Supabase), nadal w obrębie **konkretnej** `village_id` — aplikacja filtruje zapytaniem `eq('village_id', …)` przy widoku „Rynek” na profilu wsi.

Komentarze przy ofercie: publicznie widać tylko wątki pod postami typu `targ_lokalny`; komentarze pod postami wewnętrznymi — tylko dla mieszkańców (RLS).

## Świetlica

**Anonim** nie dostaje listy wszystkich sal w kraju. **Zalogowany** użytkownik może zobaczyć świetlice **tylko** w wsiach z `villages.is_active = true` (np. żeby złożyć wniosek o rezerwację). Mieszkaniec i sołtys widzą świetlice swojej wsi także przed aktywacją profilu wsi (polityki `is_village_resident` / `is_village_soltys`).

## Podsumowanie

| Obszar              | Tenant        | Kto widzi (uproszczenie)        |
|---------------------|---------------|----------------------------------|
| Posty wewnętrzne    | `village_id`  | mieszkaniec, sołtys, autor      |
| Targ (`targ_lokalny`) | `village_id` | wszyscy (filtrowane po wsi w UI) |
| Rezerwacje          | przez `hall` | właściciel + sołtys + mieszkaniec |

Po zmianach w migracji uruchom: `npx supabase db push` (lub zastosuj SQL w panelu).
