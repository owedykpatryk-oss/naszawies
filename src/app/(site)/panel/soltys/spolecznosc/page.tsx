import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysSpolecznoscKlient, type WiesDoModeracjiSpolecznosci } from "./spolecznosc-klient";
import { type TrybOrganizacji } from "./tryby-pracy";

export const metadata: Metadata = {
  title: "Społeczność i WOW (sołtys)",
};

export default async function SoltysSpolecznoscPage({
  searchParams,
}: {
  searchParams?: { tryb?: string };
}) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/spolecznosc");
  }
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <main>
        <h1 className="tytul-sekcji-panelu">Społeczność i rozwój</h1>
        <p className="mt-2 text-sm text-stone-600">Nie masz jeszcze przypisanej wsi w roli sołtysa lub współadmina.</p>
        <p className="mt-4 text-sm text-stone-600">
          <Link href="/panel/soltys" className="text-green-800 underline">
            ← Przegląd panelu
          </Link>
        </p>
      </main>
    );
  }

  const { data: rows } = await supabase.from("villages").select("id, name").in("id", villageIds).order("name");
  const wsie: WiesDoModeracjiSpolecznosci[] = (rows ?? []).map((r) => ({ id: r.id, name: r.name }));

  const { data: grupyRows } = await supabase
    .from("village_community_groups")
    .select("id, village_id, name, group_type")
    .in("village_id", villageIds)
    .eq("is_active", true)
    .order("name");
  const grupyOrganizacji = (grupyRows ?? []) as {
    id: string;
    village_id: string;
    name: string;
    group_type: string;
  }[];

  const { data: slotyRows } = await supabase
    .from("village_weekly_schedule_slots")
    .select("id, village_id, day_of_week, time_start, time_end, title")
    .in("village_id", villageIds)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("time_start", { ascending: true });
  const slotyHarmonogramu = (slotyRows ?? []) as {
    id: string;
    village_id: string;
    day_of_week: number;
    time_start: string;
    time_end: string | null;
    title: string;
  }[];

  const { data: dotRows } = await supabase
    .from("village_funding_sources")
    .select("id, village_id, title, category")
    .in("village_id", villageIds)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(120);
  const zrodlaDotacji = (dotRows ?? []) as { id: string; village_id: string; title: string; category: string }[];

  const { data: kontaktyRows } = await supabase
    .from("village_official_contacts")
    .select("id, village_id, office_key, role_label, person_name, duty_hours_text, is_verified_by_soltys, updated_at")
    .in("village_id", villageIds)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  const kontaktyUrzedowe = (kontaktyRows ?? []) as {
    id: string;
    village_id: string;
    office_key: string;
    role_label: string;
    person_name: string;
    duty_hours_text: string | null;
    is_verified_by_soltys: boolean;
    updated_at: string;
  }[];

  const { data: kadencjeRows } = await supabase
    .from("village_official_terms")
    .select("id, village_id, office_key, role_label, person_name, term_start, term_end, is_current")
    .in("village_id", villageIds)
    .order("term_start", { ascending: false })
    .limit(200);
  const kadencjeFunkcyjne = (kadencjeRows ?? []) as {
    id: string;
    village_id: string;
    office_key: string;
    role_label: string;
    person_name: string;
    term_start: string;
    term_end: string | null;
    is_current: boolean;
  }[];

  const trybZUrl: TrybOrganizacji =
    searchParams?.tryb === "kgw" || searchParams?.tryb === "osp" || searchParams?.tryb === "ogolny"
      ? searchParams.tryb
      : "ogolny";

  return (
    <main>
      <h1 className="tytul-sekcji-panelu">Społeczność i rozwój</h1>
      <p className="mt-2 text-sm text-stone-600">
        Moduły WOW dla mieszkańców: blog lokalny, historia wsi, darmowy marketplace, lokalne wiadomości i automatyzacje.
      </p>
      <p className="mt-2 text-sm text-stone-600">
        Potrzebujesz instrukcji? Zobacz{" "}
        <Link href="/panel/soltys/pomoc" className="text-green-800 underline">
          pomoc krok po kroku
        </Link>
        {" · "}
        <Link href="/panel/soltys/spolecznosc/moderacja" className="text-green-800 underline">
          moderacja zgłoszeń
        </Link>
        .
      </p>
      <div className="mt-6 rounded-xl border border-teal-200/90 bg-teal-50/50 p-4 text-sm text-teal-950">
        <p className="font-medium text-green-950">Checklista sołtysa (5 min.)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-stone-700 sm:text-sm">
          <li>Wybierz wieś w formularzu poniżej — treści zapisują się per sołectwo.</li>
          <li>Uzupełnij blog lub historię, żeby strona wsi żyła i była widoczna w wyszukiwarkach.</li>
          <li>Dodaj kilka ogłoszeń na marketplace (wszystkie darmowe) — mieszkańcy szybciej zaufażą modułowi.</li>
          <li>
            Zarejestruj KGW, klub sportowy lub zespół — potem uzupełniaj kalendarz (mecze, wyjazdy, próby) na publicznym
            profilu wsi.
          </li>
          <li>
            Uzupełnij tygodniowy plan stałych zajęć oraz listę zakupów (mieszkańcy mogą dopisywać i zaznaczać „kupione”).
          </li>
          <li>Dodaj skrócone informacje o dotacjach i programach — z linkiem do naboru (bez obietnic prawnych).</li>
          <li>Wstaw krótką wiadomość lokalną (np. wyłączenie wody, zbiórka) — buduje nawyk zaglądania na profil.</li>
          <li>
            Raz na jakiś czas uruchom automatyzacje — archiwizuje m.in. wygasłe oferty marketplace i wiadomości, wpisy
            kalendarza i naborów po terminie, zakończone wydarzenia na tablicy, bardzo stare oczekujące wpisy z RSS
            (90 dni) oraz przeczytane powiadomienia sprzed pół roku.
          </li>
        </ol>
      </div>
      <SoltysSpolecznoscKlient
        wsie={wsie}
        grupyOrganizacji={grupyOrganizacji}
        slotyHarmonogramu={slotyHarmonogramu}
        zrodlaDotacji={zrodlaDotacji}
        kontaktyUrzedowe={kontaktyUrzedowe}
        kadencjeFunkcyjne={kadencjeFunkcyjne}
        domyslnyTryb={trybZUrl}
      />
    </main>
  );
}
