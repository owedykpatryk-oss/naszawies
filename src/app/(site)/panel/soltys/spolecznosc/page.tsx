import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { SoltysSpolecznoscKlient, type WiesDoModeracjiSpolecznosci } from "./spolecznosc-klient";
import { type TrybOrganizacji } from "./tryby-pracy";
import type { OrganizacjaPelna } from "@/lib/wies/profil-organizacji";

export const metadata: Metadata = {
  title: "Społeczność i WOW (sołtys)",
};

export default async function SoltysSpolecznoscPage({
  searchParams,
}: {
  searchParams?: { tryb?: string };
}) {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Społeczność i rozwój"
        opis="Nie masz jeszcze przypisanej wsi w roli sołtysa lub współadmina."
        dzieci={null}
      />
    );
  }

  const { data: rows } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug")
    .in("id", villageIds)
    .order("name");
  const wsie: WiesDoModeracjiSpolecznosci[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    voivodeship: r.voivodeship,
    county: r.county,
    commune: r.commune,
    slug: r.slug,
  }));

  const { data: grupyRows } = await supabase
    .from("village_community_groups")
    .select(
      "id, village_id, name, group_type, short_description, contact_phone, contact_email, meeting_place, schedule_text, profile_data",
    )
    .in("village_id", villageIds)
    .eq("is_active", true)
    .order("name");
  const grupyOrganizacji = (grupyRows ?? []) as {
    id: string;
    village_id: string;
    name: string;
    group_type: string;
  }[];
  const organizacjePelne = (grupyRows ?? []) as OrganizacjaPelna[];

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
    searchParams?.tryb === "kgw" ||
    searchParams?.tryb === "osp" ||
    searchParams?.tryb === "parafia" ||
    searchParams?.tryb === "mysliwi" ||
    searchParams?.tryb === "szkola" ||
    searchParams?.tryb === "sport" ||
    searchParams?.tryb === "ogolny"
      ? searchParams.tryb
      : "ogolny";

  return (
    <PanelStronaSoltysa
      tytul="Społeczność i rozwój"
      opis={
        <>
          Moduły WOW dla mieszkańców: blog lokalny, historia wsi, darmowy marketplace, lokalne wiadomości i automatyzacje.
          Potrzebujesz instrukcji?{" "}
          <Link href="/panel/soltys/pomoc" className="font-medium text-green-800 underline">
            pomoc krok po kroku
          </Link>
          {" · "}
          <Link href="/panel/rada" className="font-medium text-green-800 underline">
            moderacja zgłoszeń (rada)
          </Link>
          .
        </>
      }
      szeroki
      dzieci={
        <>
          <details className="panel-nawigacja-szklo mb-6 text-sm text-stone-700">
            <summary className="cursor-pointer px-3 py-2.5 font-medium text-green-950">
              Checklista startu modułu (rozwiń, ~5 min.)
            </summary>
            <ol className="list-decimal space-y-1.5 border-t border-stone-200/60 px-4 py-3 text-xs leading-relaxed sm:text-sm">
              <li>Wybierz wieś w formularzu poniżej — treści zapisują się per sołectwo.</li>
              <li>Użyj trybu pracy (szkoła, sport, KGW…) — filtruje organizacje i skróty u góry formularza.</li>
              <li>Uzupełnij blog lub historię pod obszarem „Publikacje”.</li>
              <li>Dodaj ogłoszenia marketplace i krótką wiadomość lokalną.</li>
              <li>Raz na jakiś czas uruchom automatyzacje (archiwizacja wygasłych treści).</li>
            </ol>
          </details>
          <Suspense
            fallback={
              <div className="mt-6 h-40 animate-pulse rounded-2xl border border-stone-200 bg-stone-100" aria-hidden />
            }
          >
            <SoltysSpolecznoscKlient
              wsie={wsie}
              grupyOrganizacji={grupyOrganizacji}
              organizacjePelne={organizacjePelne}
              slotyHarmonogramu={slotyHarmonogramu}
              zrodlaDotacji={zrodlaDotacji}
              kontaktyUrzedowe={kontaktyUrzedowe}
              kadencjeFunkcyjne={kadencjeFunkcyjne}
              domyslnyTryb={trybZUrl}
            />
          </Suspense>
        </>
      }
    />
  );
}
