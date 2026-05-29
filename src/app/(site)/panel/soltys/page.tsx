import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { pobierzVillageIdsModeracjiTresciCache } from "@/lib/panel/rola-moderacji";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import {
  SoltysModeracjaPostowKlient,
  type PostDoModeracjiWiersz,
} from "./soltys-moderacja-postow-klient";
import { SoltysWnioskiKlient, type WniosekWiersz } from "./soltys-wnioski-klient";
import { SoltysModeracjaRynekKlient } from "./soltys-moderacja-rynek-klient";
import { SoltysProfileRynekKlient } from "./soltys-profile-rynek-klient";
import {
  pobierzLicznikiOczekujacychSoltysa,
  pobierzLicznikiPerWiesSoltysa,
} from "@/lib/panel/liczniki-oczekujacych-soltysa";
import { mapujAgendeNaWydarzenia, pobierzAgende7DniSoltysa } from "@/lib/kalendarz/pobierz-agende-7-dni";
import { SoltysAgendaTygodnia, type WydarzenieAgenda } from "./soltys-agenda-tygodnia";
import { SoltysKolejkaPracy, type PozycjaKolejki } from "./soltys-kolejka-pracy";
import {
  SoltysTransportPodglad,
  type StatusTransportuWsi,
} from "@/components/panel/soltys/soltys-transport-podglad";
import { SoltysPodsumowanieWsi } from "./soltys-podsumowanie-wsi";
import { SoltysKpiKafel } from "@/components/panel/soltys-kpi-kafel";
import { SoltysEksportPodsumowania } from "@/components/panel/soltys-eksport-podsumowania";
import { SoltysChecklist7Dni } from "@/components/panel/soltys-checklist-7-dni";
import { pobierzChecklisteSoltys7Dni } from "@/lib/panel/checklist-soltys-7-dni";
import { pobierzKatalogMozliwosciSoltysa } from "@/lib/panel/katalog-mozliwosci-soltysa";
import { SoltysKatalogMozliwosci } from "@/components/panel/soltys-katalog-mozliwosci";
export const metadata: Metadata = {
  title: "Panel sołtysa",
};

export default async function SoltysPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys");
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const moderacjaVillageIds = await pobierzVillageIdsModeracjiTresciCache(user.id);
  const mozeModerowac = moderacjaVillageIds.length > 0;

  const nazwyWsi: Record<string, string> = {};
  const hrefWsi: Record<string, string> = {};
  if (villageIds.length > 0) {
    const { data: vs } = await supabase
      .from("villages")
      .select("id, name, voivodeship, county, commune, slug")
      .in("id", villageIds);
    for (const v of vs ?? []) {
      nazwyWsi[v.id] = v.name;
      hrefWsi[v.id] = sciezkaProfiluWsi({
        voivodeship: v.voivodeship,
        county: v.county,
        commune: v.commune,
        slug: v.slug,
      });
    }
  }

  let wnioski: WniosekWiersz[] = [];
  type WniosekRaw = {
    id: string;
    user_id: string;
    village_id: string;
    created_at: string;
    role: string;
  };
  let surowe: WniosekRaw[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("user_village_roles")
      .select("id, user_id, village_id, created_at, role")
      .in("village_id", villageIds)
      .in("role", ["mieszkaniec", "osp_naczelnik", "kgw_przewodniczaca", "rada_solecka"])
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    surowe = (data ?? []) as WniosekRaw[];
  }

  const userIds = Array.from(new Set(surowe.map((w) => w.user_id)));

  const mapaUzytkownikow: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, display_name").in("id", userIds);
    for (const u of users ?? []) {
      mapaUzytkownikow[u.id] = u.display_name;
    }
  }

  wnioski = surowe.map((w) => ({
    id: w.id,
    created_at: w.created_at,
    wies: nazwyWsi[w.village_id] ?? "—",
    mieszkaniec: mapaUzytkownikow[w.user_id] ?? w.user_id.slice(0, 8),
    rola: w.role,
  }));

  type WpisPostu = { id: string; title: string; village_id: string; created_at: string };
  let postySurowe: WpisPostu[] = [];
  if (mozeModerowac) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, village_id, created_at")
      .in("village_id", moderacjaVillageIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(30);
    postySurowe = (data ?? []) as WpisPostu[];
  }

  const postyDoModeracji: PostDoModeracjiWiersz[] = postySurowe.map((p) => ({
    id: p.id,
    title: p.title,
    wies: nazwyWsi[p.village_id] ?? "Wieś",
    created_at: p.created_at,
    hrefWsi: hrefWsi[p.village_id] ?? null,
  }));

  type WierszModeracjiRynek = {
    id: string;
    title: string;
    typ: "marketplace" | "pomoc";
    wies: string;
    sciezkaWsi?: string | null;
    owner_user_id?: string | null;
    created_at?: string | null;
    listing_type?: string | null;
    equipment_category?: string | null;
    category?: string | null;
    description?: string | null;
    image_urls?: string[] | null;
    price_amount?: number | null;
    price_unit?: string | null;
    currency?: string | null;
    parcel_number?: string | null;
    cadastral_district?: string | null;
    parcel_area_m2?: number | null;
    parcel_geojson?: unknown;
    latitude?: number | null;
    longitude?: number | null;
  };
  let doModeracjiRynek: WierszModeracjiRynek[] = [];
  if (mozeModerowac) {
    const [{ data: mkRaw }, { data: psRaw }] = await Promise.all([
      supabase
        .from("marketplace_listings")
        .select(
          "id, title, village_id, owner_user_id, created_at, listing_type, equipment_category, category, description, image_urls, price_amount, price_unit, currency, parcel_number, cadastral_district, parcel_area_m2, parcel_geojson, latitude, longitude",
        )
        .in("village_id", moderacjaVillageIds)
        .eq("status", "pending")
        .limit(30),
      supabase
        .from("neighbor_help_offers")
        .select("id, title, village_id")
        .in("village_id", moderacjaVillageIds)
        .eq("status", "pending")
        .limit(15),
    ]);
    doModeracjiRynek = [
      ...((mkRaw ?? []) as {
        id: string;
        title: string;
        village_id: string;
        owner_user_id: string;
        created_at: string;
        listing_type: string;
        equipment_category: string | null;
        category: string | null;
        description: string;
        image_urls: string[] | null;
        price_amount: number | null;
        price_unit: string | null;
        currency: string | null;
        parcel_number: string | null;
        cadastral_district: string | null;
        parcel_area_m2: number | null;
        parcel_geojson: unknown;
        latitude: number | null;
        longitude: number | null;
      }[]).map((r) => ({
        id: r.id,
        title: r.title,
        typ: "marketplace" as const,
        wies: nazwyWsi[r.village_id] ?? "—",
        sciezkaWsi: hrefWsi[r.village_id] ?? null,
        owner_user_id: r.owner_user_id,
        created_at: r.created_at,
        listing_type: r.listing_type,
        equipment_category: r.equipment_category,
        category: r.category,
        description: r.description,
        image_urls: r.image_urls,
        price_amount: r.price_amount,
        price_unit: r.price_unit,
        currency: r.currency,
        parcel_number: r.parcel_number,
        cadastral_district: r.cadastral_district,
        parcel_area_m2: r.parcel_area_m2,
        parcel_geojson: r.parcel_geojson,
        latitude: r.latitude,
        longitude: r.longitude,
      })),
      ...((psRaw ?? []) as { id: string; title: string; village_id: string }[]).map((r) => ({
        id: r.id,
        title: r.title,
        typ: "pomoc" as const,
        wies: nazwyWsi[r.village_id] ?? "—",
      })),
    ];
  }

  let profileRynek: { id: string; business_name: string; is_verified: boolean; wies: string }[] = [];
  if (mozeModerowac) {
    const { data: profileRaw } = await supabase
      .from("marketplace_profiles")
      .select("id, business_name, is_verified, village_id")
      .in("village_id", moderacjaVillageIds)
      .order("business_name")
      .limit(40);
    profileRynek = ((profileRaw ?? []) as {
      id: string;
      business_name: string;
      is_verified: boolean;
      village_id: string;
    }[]).map((p) => ({
      id: p.id,
      business_name: p.business_name,
      is_verified: p.is_verified,
      wies: nazwyWsi[p.village_id] ?? "—",
    }));
  }

  let liczniki = {
    wnioski: 0,
    rezerwacje: 0,
    posty: 0,
    wiadomosci: 0,
    rynek: 0,
    pomoc: 0,
    zgloszenia: 0,
    zdjecia: 0,
    raportySpolecznosci: 0,
  };
  let licznikiPerWies: Awaited<ReturnType<typeof pobierzLicznikiPerWiesSoltysa>> = [];
  let kolejkaPracy: PozycjaKolejki[] = [];
  let agendaTygodnia: WydarzenieAgenda[] = [];

  let liczbaWiadomosciDoAkceptu = 0;
  let liczbaKanaalowRss = 0;
  let liczbaWydarzen7Dni = 0;
  let liczbaGrupKgw = 0;
  let liczbaGrupOsp = 0;
  let liczbaWydarzenKgw7Dni = 0;
  let liczbaWydarzenOsp7Dni = 0;
  let liczbaLinkowNiekompletnych = 0;
  if (villageIds.length > 0) {
    liczniki = await pobierzLicznikiOczekujacychSoltysa(supabase, villageIds);
    licznikiPerWies = await pobierzLicznikiPerWiesSoltysa(supabase, villageIds);

    const [{ data: zgloszeniaKolejka }, zdjeciaRes] = await Promise.all([
      supabase
        .from("issues")
        .select("id, title, village_id, created_at, is_urgent, status")
        .in("village_id", villageIds)
        .in("status", ["nowe", "w_trakcie"])
        .order("is_urgent", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
      mozeModerowac
        ? supabase
            .from("photos")
            .select("id, caption, village_id, created_at")
            .in("village_id", moderacjaVillageIds)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] as { id: string; caption: string | null; village_id: string; created_at: string }[] }),
    ]);
    const zdjeciaKolejka = zdjeciaRes.data;

    agendaTygodnia = mapujAgendeNaWydarzenia(await pobierzAgende7DniSoltysa(supabase, villageIds));

    kolejkaPracy = [
      ...wnioski.slice(0, 4).map((w) => ({
        id: w.id,
        typ: "wniosek" as const,
        tytul: `${w.mieszkaniec} — ${w.rola}`,
        wies: w.wies,
        data: w.created_at,
        href: "/panel/soltys#wnioski-o-role",
      })),
      ...(mozeModerowac
        ? postyDoModeracji.slice(0, 4).map((p) => ({
            id: p.id,
            typ: "post" as const,
            tytul: p.title,
            wies: p.wies,
            data: p.created_at,
            href: "/panel/soltys#posty-do-moderacji",
          }))
        : []),
      ...(mozeModerowac
        ? doModeracjiRynek.slice(0, 4).map((r) => ({
            id: r.id,
            typ: r.typ === "marketplace" ? ("rynek" as const) : ("pomoc" as const),
            tytul: r.title,
            wies: r.wies,
            data: new Date().toISOString(),
            href: "/panel/soltys#moderacja-mieszkancow",
          }))
        : []),
      ...((zgloszeniaKolejka ?? []) as {
        id: string;
        title: string;
        village_id: string;
        created_at: string;
        is_urgent: boolean;
      }[]).map((z) => ({
        id: z.id,
        typ: "zgloszenie" as const,
        tytul: z.title,
        wies: nazwyWsi[z.village_id] ?? "—",
        data: z.created_at,
        href: "/panel/soltys/zgloszenia",
        pilne: z.is_urgent,
      })),
      ...((zdjeciaKolejka ?? []) as {
        id: string;
        caption: string | null;
        village_id: string;
        created_at: string;
      }[]).map((z) => ({
        id: z.id,
        typ: "zdjecie" as const,
        tytul: z.caption?.trim() || "Zdjęcie do akceptacji",
        wies: nazwyWsi[z.village_id] ?? "—",
        data: z.created_at,
        href: mozeModerowac ? "/panel/soltys/fotokronika" : "/panel/rada",
      })),
    ]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 12);

    const teraz = new Date();
    const terazIso = teraz.toISOString();
    const za7dniIso = new Date(teraz.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: cNews }, { count: cFeeds }, { count: cEvents7Dni }, { data: grupyRows }, { data: linkiRows }] =
      await Promise.all([
        supabase
          .from("local_news_items")
          .select("id", { count: "exact", head: true })
          .in("village_id", villageIds)
          .in("status", ["pending", "draft"]),
        supabase
          .from("village_news_feed_sources")
          .select("id", { count: "exact", head: true })
          .in("village_id", villageIds),
        supabase
          .from("village_community_events")
          .select("id", { count: "exact", head: true })
          .in("village_id", villageIds)
          .eq("status", "approved")
          .gte("starts_at", terazIso)
          .lte("starts_at", za7dniIso),
        supabase
          .from("village_community_groups")
          .select("id, group_type")
          .in("village_id", villageIds)
          .eq("is_active", true)
          .limit(500),
        supabase
          .from("village_useful_links")
          .select("id, url, phone, email, is_active")
          .in("village_id", villageIds)
          .eq("is_active", true)
          .limit(500),
      ]);

    liczbaWiadomosciDoAkceptu = cNews ?? 0;
    liczbaKanaalowRss = cFeeds ?? 0;
    liczbaWydarzen7Dni = cEvents7Dni ?? 0;

    const grupy = (grupyRows ?? []) as { id: string; group_type: string }[];
    const idsKgw = grupy.filter((g) => g.group_type === "kgw").map((g) => g.id);
    const idsOsp = grupy.filter((g) => g.group_type === "sport" || g.group_type === "osp").map((g) => g.id);
    liczbaGrupKgw = idsKgw.length;
    liczbaGrupOsp = idsOsp.length;

    liczbaLinkowNiekompletnych = ((linkiRows ?? []) as { url: string | null; phone: string | null; email: string | null }[]).filter(
      (l) => !l.url?.trim() && !l.phone?.trim() && !l.email?.trim(),
    ).length;

    const [kgwRes, ospRes] = await Promise.all([
      idsKgw.length > 0
        ? supabase
            .from("village_community_events")
            .select("id", { count: "exact", head: true })
            .in("group_id", idsKgw)
            .eq("status", "approved")
            .gte("starts_at", terazIso)
            .lte("starts_at", za7dniIso)
        : Promise.resolve({ count: 0 }),
      idsOsp.length > 0
        ? supabase
            .from("village_community_events")
            .select("id", { count: "exact", head: true })
            .in("group_id", idsOsp)
            .eq("status", "approved")
            .gte("starts_at", terazIso)
            .lte("starts_at", za7dniIso)
        : Promise.resolve({ count: 0 }),
    ]);
    liczbaWydarzenKgw7Dni = kgwRes.count ?? 0;
    liczbaWydarzenOsp7Dni = ospRes.count ?? 0;
  }

  const listaNazwWsi = Object.values(nazwyWsi);

  const { data: profilSoltysa } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const profilNickOk = (profilSoltysa?.display_name ?? "").trim().length >= 2;
  let wiesOpisWypelniony = true;
  if (villageIds.length > 0) {
    const { data: opisyWsi } = await supabase.from("villages").select("description").in("id", villageIds);
    const opisy = (opisyWsi ?? []).map((w) => (w.description ?? "").trim());
    wiesOpisWypelniony =
      opisy.length === villageIds.length && opisy.every((t) => t.length >= 30);
  }
  const checklist7 = await pobierzChecklisteSoltys7Dni(
    supabase,
    villageIds,
    profilNickOk,
    wiesOpisWypelniony,
  );
  const katalogMozliwosci = await pobierzKatalogMozliwosciSoltysa(supabase, villageIds);

  let statusTransportu: StatusTransportuWsi[] = [];
  if (villageIds.length > 0) {
    const { data: linie } = await supabase
      .from("village_transport_line_status")
      .select("village_id, status_color, status_label, delayed_count, cancelled_count, fallback_mode, updated_at")
      .in("village_id", villageIds);
    statusTransportu = (linie ?? []).map((l) => ({
      villageId: l.village_id,
      wiesNazwa: nazwyWsi[l.village_id] ?? "Wieś",
      statusColor: l.status_color,
      statusLabel: l.status_label,
      delayedCount: l.delayed_count ?? 0,
      cancelledCount: l.cancelled_count ?? 0,
      fallbackMode: Boolean(l.fallback_mode),
      lastRealtime: l.updated_at,
    }));
  }

  return (
    <main>
      <SoltysChecklist7Dni checklist={checklist7} />
      {villageIds.length > 0 ? <SoltysKatalogMozliwosci katalog={katalogMozliwosci} /> : null}
      <header className="panel-informacji-hero">
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="tytul-sekcji-panelu">Panel sołtysa</h1>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-stone-600">
              Moderacja, rezerwacje, dokumenty i komunikacja z mieszkańcami — w jednym miejscu. Zacznij od{" "}
              <Link href="/panel/soltys#kolejka-pracy" className="link-panel">
                kolejki pracy
              </Link>{" "}
              lub{" "}
              <Link href="/panel/soltys/pomoc" className="link-panel">
                pomocy krok po kroku
              </Link>
              .
            </p>
          </div>
          {villageIds.length > 0 ? (
            <SoltysEksportPodsumowania
              liczniki={liczniki}
              kolejka={kolejkaPracy}
              nazwyWsi={listaNazwWsi}
            />
          ) : null}
        </div>
      </header>

      {villageIds.length > 0 ? (
        <section className="soltys-sekcja mt-8 border-amber-200/60 bg-gradient-to-br from-amber-50/30 via-white to-stone-50/50">
          <h2 className="font-serif text-lg text-green-950">Dziś do zrobienia</h2>
          <p className="mt-1 text-xs text-stone-600">
            Kafelki z liczbą oczekujących — kliknij, aby przejść do modułu. Zaznacz wiele pozycji i zatwierdź masowo w
            sekcjach poniżej.
          </p>
          <div className="siatka-kafli-responsywna mt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <SoltysKpiKafel
              href="/panel/soltys#wnioski-o-role"
              etykieta="Wnioski o role"
              liczba={liczniki.wnioski}
              opis="Akceptacja lub odrzucenie"
              priorytet={liczniki.wnioski > 0 ? "uwaga" : "neutral"}
            />
            <SoltysKpiKafel
              href="/panel/soltys/rezerwacje"
              etykieta="Rezerwacje sal"
              liczba={liczniki.rezerwacje}
              opis="Wnioski do decyzji"
              priorytet={liczniki.rezerwacje > 0 ? "uwaga" : "neutral"}
            />
            <SoltysKpiKafel
              href="/panel/soltys/zgloszenia"
              etykieta="Zgłoszenia"
              liczba={liczniki.zgloszenia}
              opis="Nowe i w trakcie"
              priorytet={liczniki.zgloszenia > 0 ? "pilne" : "neutral"}
            />
            {mozeModerowac ? (
              <>
                <SoltysKpiKafel
                  href="/panel/soltys/wiadomosci-lokalne"
                  etykieta="Posty + wiadomości"
                  liczba={liczniki.posty + liczniki.wiadomosci}
                  opis="Moderacja profilu wsi"
                  priorytet={liczniki.posty + liczniki.wiadomosci > 0 ? "uwaga" : "neutral"}
                />
                <SoltysKpiKafel
                  href="/panel/soltys#moderacja-mieszkancow"
                  etykieta="Rynek + pomoc"
                  liczba={liczniki.rynek + liczniki.pomoc}
                  opis={`${liczniki.rynek} ogłoszeń · ${liczniki.pomoc} pomocy`}
                  priorytet={liczniki.rynek + liczniki.pomoc > 0 ? "uwaga" : "neutral"}
                />
                <SoltysKpiKafel
                  href="/panel/soltys/fotokronika"
                  etykieta="Fotokronika"
                  liczba={liczniki.zdjecia}
                  opis="Zdjęcia do akceptacji"
                  priorytet={liczniki.zdjecia > 0 ? "uwaga" : "neutral"}
                />
                <SoltysKpiKafel
                  href="/panel/soltys/spolecznosc/moderacja"
                  etykieta="Raporty treści"
                  liczba={liczniki.raportySpolecznosci}
                  opis="Dyskusje i blog"
                  priorytet={liczniki.raportySpolecznosci > 0 ? "uwaga" : "neutral"}
                />
              </>
            ) : (
              <SoltysKpiKafel
                href="/panel/rada"
                etykieta="Moderacja treści"
                liczba={0}
                opis="Zadanie rady sołeckiej — nie sołtysa"
                priorytet="neutral"
              />
            )}
            <SoltysKpiKafel
              href="/panel/soltys/informacje-lokalne"
              etykieta="Linki mieszkańców"
              liczba={liczbaLinkowNiekompletnych}
              opis="Bez kontaktu / URL"
              priorytet={liczbaLinkowNiekompletnych > 0 ? "uwaga" : "neutral"}
            />
            <SoltysKpiKafel
              href="/panel/soltys/kalendarz"
              etykieta="Kalendarz 7 dni"
              liczba={agendaTygodnia.length || liczbaWydarzen7Dni}
              opis="Wydarzenia, świetlica, terminy"
            />
            <SoltysKpiKafel
              href="/panel/soltys/transport"
              etykieta="Transport PKP"
              liczba={statusTransportu.filter((s) => s.statusColor !== "green").length}
              opis="Opóźnienia / odwołania"
              priorytet={
                statusTransportu.some((s) => s.statusColor === "red")
                  ? "uwaga"
                  : statusTransportu.some((s) => s.statusColor === "orange")
                    ? "uwaga"
                    : "neutral"
              }
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
            <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1">
              RSS: <strong>{liczbaKanaalowRss}</strong>
            </span>
            <Link
              href="/panel/soltys/dokumenty"
              className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 font-medium text-green-900 hover:bg-green-100"
            >
              Generator PDF →
            </Link>
            <Link
              href="/panel/soltys/grafika"
              className="rounded-full border border-stone-200 bg-white px-2.5 py-1 hover:bg-stone-50"
            >
              Kreator grafiki →
            </Link>
            <Link
              href="/panel/soltys/kalendarz"
              className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-950 hover:bg-blue-100"
            >
              Kalendarz organizacyjny →
            </Link>
          </div>
          <SoltysPodsumowanieWsi wiersze={licznikiPerWies} nazwyWsi={nazwyWsi} />
          <SoltysTransportPodglad wiersze={statusTransportu} />
          <SoltysAgendaTygodnia wydarzenia={agendaTygodnia} />
        </section>
      ) : null}

      {villageIds.length > 0 ? (
        <SoltysKolejkaPracy pozycje={kolejkaPracy} liczniki={liczniki} pokazModeracje={mozeModerowac} />
      ) : null}

      {villageIds.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-fuchsia-50/40 p-4 sm:p-5">
          <h2 className="font-serif text-lg text-green-950">Centra ról organizacyjnych</h2>
          <p className="mt-1 text-xs text-stone-600">
            Wejdź od razu w właściwy kontekst pracy, zamiast szukać opcji po całym panelu.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/panel/soltys/spolecznosc?tryb=kgw"
              className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/45 p-4 shadow-sm transition hover:border-fuchsia-400"
            >
              <p className="text-xs text-fuchsia-900">Centrum KGW</p>
              <p className="mt-1 text-lg font-semibold text-fuchsia-950">
                Grupy: {liczbaGrupKgw} · Wydarzenia 7 dni: {liczbaWydarzenKgw7Dni}
              </p>
              <p className="mt-1 text-xs text-stone-700">Harmonogram spotkań, inicjatywy i dokumenty pod dotacje.</p>
            </Link>
            <Link
              href="/panel/soltys/spolecznosc?tryb=osp"
              className="rounded-xl border border-indigo-200 bg-indigo-50/45 p-4 shadow-sm transition hover:border-indigo-400"
            >
              <p className="text-xs text-indigo-900">Centrum OSP / sport</p>
              <p className="mt-1 text-lg font-semibold text-indigo-950">
                Grupy: {liczbaGrupOsp} · Wydarzenia 7 dni: {liczbaWydarzenOsp7Dni}
              </p>
              <p className="mt-1 text-xs text-stone-700">
                Ćwiczenia, mecze, komunikaty bezpieczeństwa i szybkie planowanie tygodnia.
              </p>
            </Link>
          </div>
        </section>
      ) : null}

      {villageIds.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 p-4 sm:p-5">
          <h2 className="font-serif text-lg text-green-950">Szybkie działania</h2>
          <p className="mt-1 text-xs text-stone-600">
            Skróty do modułów, które oszczędzają czas — od dokumentów po świetlicę i społeczność.
          </p>
          <div className="siatka-kafli-responsywna mt-4">
            <Link
              href="/panel/soltys/dokumenty"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Generator dokumentów</span>
              <span className="mt-1 block text-xs text-stone-600">
                Scenariusze 1‑klik i lejek sponsora (prośba → przypomnienie → wpływ → podziękowanie).
              </span>
            </Link>
            <Link
              href="/panel/soltys/grafika"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Kreator grafiki</span>
              <span className="mt-1 block text-xs text-stone-600">
                Zaproszenia, dyplomy, plakaty i podziękowania — PDF jak w Canvie, bez konta zewnętrznego.
              </span>
            </Link>
            <Link
              href="/panel/soltys/rezerwacje"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Rezerwacje sal</span>
              <span className="mt-1 block text-xs text-stone-600">
                Checklista przygotowania, rekomendacje zakupów i druk dla wydarzeń.
              </span>
            </Link>
            <Link
              href="/panel/soltys/spolecznosc"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Społeczność i WOW</span>
              <span className="mt-1 block text-xs text-stone-600">
                Blog, historia, marketplace, KGW i kluby, kalendarz wydarzeń, wiadomości i automatyzacje.
              </span>
            </Link>
            <Link
              href="/panel/soltys/spolecznosc?tryb=kgw"
              className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/40 p-4 text-sm shadow-sm transition hover:border-fuchsia-400 hover:shadow-md"
            >
              <span className="font-semibold text-fuchsia-950">Tryb KGW</span>
              <span className="mt-1 block text-xs text-stone-600">
                Od razu filtruje moduł społeczności pod działania KGW i wydarzenia koła.
              </span>
            </Link>
            <Link
              href="/panel/soltys/spolecznosc?tryb=osp"
              className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm shadow-sm transition hover:border-indigo-400 hover:shadow-md"
            >
              <span className="font-semibold text-indigo-950">Tryb OSP / sport</span>
              <span className="mt-1 block text-xs text-stone-600">
                Szybki start dla komunikatów OSP, harmonogramu treningów i wydarzeń sportowych.
              </span>
            </Link>
            <Link
              href="/panel/soltys/swietlica"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Świetlica i wyposażenie</span>
              <span className="mt-1 block text-xs text-stone-600">
                Układ sali, asortyment i szybkie pakiety wyposażenia.
              </span>
            </Link>
            <Link
              href="/panel/soltys/moja-wies"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Profil wsi</span>
              <span className="mt-1 block text-xs text-stone-600">Treści widoczne publicznie na naszawies.pl.</span>
            </Link>
            <Link
              href="/panel/soltys/wiadomosci-lokalne"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Wiadomości do akceptu</span>
              <span className="mt-1 block text-xs text-stone-600">
                {liczbaWiadomosciDoAkceptu > 0
                  ? `Oczekujące wpisy: ${liczbaWiadomosciDoAkceptu} (w tym z RSS).`
                  : "Brak oczekujących — sprawdź po synchronizacji kanałów."}
              </span>
            </Link>
            <Link
              href="/panel/soltys/kanaly-rss"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Kanały RSS</span>
              <span className="mt-1 block text-xs text-stone-600">
                {liczbaKanaalowRss > 0
                  ? `Podłączone źródła: ${liczbaKanaalowRss}.`
                  : "Brak kanałów — dodaj adres kanału gminy lub lokalnej prasy."}
              </span>
            </Link>
            <Link
              href="/panel/soltys/samorzad"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Przewodnik samorządowy</span>
              <span className="mt-1 block text-xs text-stone-600">
                Kontakty do gminy, śmieci, drogi — widoczne na profilu wsi.
              </span>
            </Link>
            <Link
              href="/panel/soltys/informacje-lokalne"
              className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Informacje dla mieszkańców</span>
              <span className="mt-1 block text-xs text-stone-600">
                BIP, urząd gminy, gazeta, radio, portale i numery telefonów.
              </span>
            </Link>
            <Link
              href="/panel/powiadomienia"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Powiadomienia</span>
              <span className="mt-1 block text-xs text-stone-600">Filtr nieprzeczytanych i szybki podgląd treści.</span>
            </Link>
          </div>
        </section>
      ) : null}

      {villageIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie jesteś zapisany jako aktywny sołtys ani współadmin w żadnej wsi. Rola <strong>sołtysa</strong> w danej wsi
          jest <strong>jednoosobowa</strong>. Przypisania ustala zespół serwisu — skontaktuj się, jeśli to Twoja
          miejscowość, a w panelu widzisz ten komunikat.
        </p>
      ) : null}

      <section id="wnioski-o-role" className="soltys-sekcja scroll-mt-24 mt-10">
        <h2 className="font-serif text-xl text-green-950">Wnioski o role we wsi</h2>
        <div className="mt-4">
          <SoltysWnioskiKlient wnioski={wnioski} />
        </div>
      </section>

      <section id="posty-do-moderacji" className="soltys-sekcja scroll-mt-24 mt-8">
        {mozeModerowac ? (
          <>
            <h2 className="font-serif text-xl text-green-950">Posty do moderacji</h2>
            <p className="mt-1 text-sm text-stone-600">
              Zatwierdzone trafiają na publiczny profil wsi. Przy odrzuceniu autor dostaje krótką notatkę w
              powiadomieniu w aplikacji.
            </p>
            <div className="mt-4">
              <SoltysModeracjaPostowKlient posty={postyDoModeracji} />
            </div>
            <div id="moderacja-mieszkancow" className="scroll-mt-24">
              <SoltysModeracjaRynekKlient wiersze={doModeracjiRynek} />
            </div>
            <SoltysProfileRynekKlient profile={profileRynek} />
          </>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
            <h2 className="font-serif text-xl text-green-950">Moderacja treści</h2>
            <p className="mt-2">
              Sołtys nie akceptuje ogłoszeń, postów ani zdjęć — to zadanie{" "}
              <strong>rady sołeckiej</strong> (lub współadmina). Ty zajmujesz się sprawami sołeckimi: wnioski o
              role, rezerwacje, zgłoszenia i profil wsi.
            </p>
            <Link href="/panel/rada" className="mt-3 inline-block font-medium text-emerald-900 underline">
              Panel moderacji rady sołeckiej →
            </Link>
          </div>
        )}
      </section>

      <p className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-500">
        <Link href="/panel/soltys#wnioski-o-role" className="text-green-800 underline">
          Wnioski o role
        </Link>
        <Link href="/panel/soltys/rezerwacje" className="text-green-800 underline">
          Rezerwacje sal
        </Link>
        <Link href="/panel/soltys/swietlica" className="text-green-800 underline">
          Świetlica i wyposażenie
        </Link>
        <Link href="/panel/soltys/spolecznosc" className="text-green-800 underline">
          Społeczność i WOW
        </Link>
        <Link href="/panel/soltys/dokumenty" className="text-green-800 underline">
          Generator dokumentów
        </Link>
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          Panel mieszkańca
        </Link>
      </p>
    </main>
  );
}
