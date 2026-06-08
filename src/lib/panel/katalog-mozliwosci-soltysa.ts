import type { SupabaseClient } from "@supabase/supabase-js";
import {
  transportAutobusSkonfigurowany,
  transportKolejWlaczony,
} from "@/lib/mapa/konfiguracja-automatyzacji";

export type StatusMozliwosci = "wlaczone" | "do_uruchomienia" | "narzedzie";

export type KategoriaMozliwosci =
  | "mapa"
  | "komunikacja"
  | "organizacja"
  | "bezpieczenstwo"
  | "transport";

export type MozliwoscSoltysa = {
  id: string;
  kategoria: KategoriaMozliwosci;
  ikona: string;
  tytul: string;
  coDostajaMieszkancy: string;
  coRobiSoltys: string;
  href: string;
  status: StatusMozliwosci;
  automatyczne: boolean;
  wskazowka?: string;
};

export type KatalogMozliwosciSoltysa = {
  pozycje: MozliwoscSoltysa[];
  wlaczone: number;
  doUruchomienia: number;
  lacznie: number;
  transportPlatforma: boolean;
};

type StanWsi = {
  maGranice: boolean;
  liczbaPoi: number;
  maPrzystanek: boolean;
  maStacje: boolean;
  maLadneMiejsce: boolean;
  maPolowanie: boolean;
  maLesnictwo: boolean;
  maRolnictwo: boolean;
  maKalendarzLowiecki: boolean;
  maMieszkanca: boolean;
  maTresc: boolean;
  maZgloszenie: boolean;
  maRezerwacje: boolean;
  maRynek: boolean;
  maFoto: boolean;
  maRss: boolean;
  maWydarzenie: boolean;
  maWspoladmin: boolean;
  maTransportCache: boolean;
  maOpis: boolean;
  maSale: boolean;
  maTablicaSzkoly: boolean;
};

export async function pobierzKatalogMozliwosciSoltysa(
  supabase: SupabaseClient,
  villageIds: string[],
): Promise<KatalogMozliwosciSoltysa> {
  const puste: KatalogMozliwosciSoltysa = {
    pozycje: [],
    wlaczone: 0,
    doUruchomienia: 0,
    lacznie: 0,
    transportPlatforma: transportKolejWlaczony() || transportAutobusSkonfigurowany(),
  };
  if (villageIds.length === 0) return puste;

  const teraz = new Date().toISOString();

  const [
    { data: wsi },
    { data: pois },
    { count: mieszkancy },
    { count: posty },
    { count: wiadomosci },
    { count: zgloszenia },
    { count: rezerwacje },
    { count: rynek },
    { count: foto },
    { count: rss },
    { count: wydarzenia },
    { count: wspoladmin },
    { count: polowania },
    { count: lesnictwoProfil },
    { count: lesnictwoOstrzezenia },
    { count: rolnictwoProfil },
    { count: kalendarzLowiecki },
    { count: transportCache },
    { count: sale },
    { count: przystanki },
    { count: stacje },
    { count: ogloszeniaSzkoly },
  ] = await Promise.all([
    supabase.from("villages").select("id, description, boundary_geojson").in("id", villageIds),
    supabase.from("pois").select("village_id, category").in("village_id", villageIds),
    supabase
      .from("user_village_roles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("role", "mieszkaniec")
      .eq("status", "active"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
    supabase
      .from("village_bulletins")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "published"),
    supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds),
    supabase
      .from("hall_bookings")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds),
    supabase
      .from("marketplace_listings")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
    supabase
      .from("village_news_feed_sources")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds),
    supabase
      .from("village_community_events")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
    supabase
      .from("user_village_roles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("role", "wspoladmin")
      .eq("status", "active"),
    supabase
      .from("village_hunting_notices")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved")
      .lte("starts_at", teraz)
      .gte("ends_at", teraz),
    supabase
      .from("village_forestry_profiles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("is_published", true),
    supabase
      .from("village_forestry_notices")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved")
      .lte("starts_at", teraz)
      .gte("ends_at", teraz),
    supabase
      .from("village_agriculture_profiles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("is_published", true),
    supabase
      .from("village_hunting_schedule_entries")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .gte("ends_at", teraz),
    supabase
      .from("transport_departures_cache")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .gte("planned_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()),
    supabase.from("halls").select("id", { count: "exact", head: true }).in("village_id", villageIds),
    supabase
      .from("pois")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("category", "przystanek"),
    supabase
      .from("pois")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("category", "stacja_kolejowa"),
    supabase
      .from("school_announcements")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
  ]);

  const opisyOk = (wsi ?? []).filter((w) => (w.description ?? "").trim().length >= 30).length > 0;
  const graniceOk = (wsi ?? []).some((w) => w.boundary_geojson != null);
  const liczbaPoi = (pois ?? []).length;
  const maPrzystanek = (przystanki ?? 0) > 0;
  const maStacje = (stacje ?? 0) > 0;
  const maLadne = (pois ?? []).some((p) => p.category === "ladne_miejsce");

  const stan: StanWsi = {
    maGranice: graniceOk,
    liczbaPoi,
    maPrzystanek,
    maStacje,
    maLadneMiejsce: maLadne,
    maPolowanie: (polowania ?? 0) > 0,
    maLesnictwo: (lesnictwoProfil ?? 0) > 0 || (lesnictwoOstrzezenia ?? 0) > 0,
    maRolnictwo: (rolnictwoProfil ?? 0) > 0,
    maKalendarzLowiecki: (kalendarzLowiecki ?? 0) > 0,
    maMieszkanca: (mieszkancy ?? 0) > 0,
    maTresc: (posty ?? 0) > 0 || (wiadomosci ?? 0) > 0,
    maZgloszenie: (zgloszenia ?? 0) > 0,
    maRezerwacje: (rezerwacje ?? 0) > 0,
    maRynek: (rynek ?? 0) > 0,
    maFoto: (foto ?? 0) > 0,
    maRss: (rss ?? 0) > 0,
    maWydarzenie: (wydarzenia ?? 0) > 0,
    maWspoladmin: (wspoladmin ?? 0) > 0,
    maTransportCache: (transportCache ?? 0) > 0 || maStacje,
    maOpis: opisyOk,
    maSale: (sale ?? 0) > 0,
    maTablicaSzkoly: (ogloszeniaSzkoly ?? 0) > 0,
  };

  const transportPlatforma = transportKolejWlaczony() || transportAutobusSkonfigurowany();

  const pozycje: MozliwoscSoltysa[] = [
    {
      id: "profil_wsi",
      kategoria: "komunikacja",
      ikona: "🏡",
      tytul: "Profil wsi online",
      coDostajaMieszkancy: "Opis, zdjęcia, link do strony wsi i kod QR na tablicę.",
      coRobiSoltys: "Uzupełnij opis, baner i linki w profilu wsi.",
      href: "/panel/soltys/moja-wies",
      status: stan.maOpis ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "mapa_granica",
      kategoria: "mapa",
      ikona: "🗺️",
      tytul: "Obrys wsi na mapie (PRG)",
      coDostajaMieszkancy: "Widzą granice sołectwa na mapie publicznej.",
      coRobiSoltys: "Synchronizacja z Geoportalu — uruchamia się też w tle z mapy.",
      href: "/mapa",
      status: stan.maGranice ? "wlaczone" : "do_uruchomienia",
      automatyczne: true,
      wskazowka: stan.maGranice ? undefined : "Cron lub wejście na /mapa uzupełnia obrys.",
    },
    {
      id: "mapa_poi",
      kategoria: "mapa",
      ikona: "📍",
      tytul: "Miejsca na mapie (OSM)",
      coDostajaMieszkancy: "Szkoła, kościół, sklep, OSP, przystanki — pinezki na mapie.",
      coRobiSoltys: "Jedno kliknięcie: „Uzupełnij z OSM” w profilu wsi.",
      href: "/panel/soltys/moja-wies",
      status: stan.liczbaPoi >= 4 ? "wlaczone" : "do_uruchomienia",
      automatyczne: true,
    },
    {
      id: "mapa_transport",
      kategoria: "transport",
      ikona: "🚌",
      tytul: "Transport: PKP + PKS",
      coDostajaMieszkancy: "Odjazdy przy stacji/przystanku na mapie i w profilu wsi.",
      coRobiSoltys: "Odśwież rozkład; przy GTFS przystanki mogą powstać same.",
      href: "/panel/soltys/transport",
      status: stan.maTransportCache ? "wlaczone" : transportPlatforma ? "do_uruchomienia" : "do_uruchomienia",
      automatyczne: true,
      wskazowka: transportPlatforma
        ? undefined
        : "API PKP/GTFS wyłączone — możesz wpisać rozkład PKS ręcznie w module Transport.",
    },
    {
      id: "ladne_miejsca",
      kategoria: "mapa",
      ikona: "✨",
      tytul: "Ładne miejsca ze zdjęciem",
      coDostajaMieszkancy: "Pinezki z miniaturą, komentarze, strona miejsca.",
      coRobiSoltys: "Dodaj punkt ze zdjęciem w profilu wsi.",
      href: "/panel/soltys/moja-wies",
      status: stan.maLadneMiejsce ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "mieszkancy",
      kategoria: "komunikacja",
      ikona: "👥",
      tytul: "Konta mieszkańców",
      coDostajaMieszkancy: "Dostęp do panelu, zgłoszeń, rynku, fotokroniki.",
      coRobiSoltys: "Zaakceptuj wnioski o rolę „mieszkaniec”.",
      href: "/panel/soltys#wnioski-o-role",
      status: stan.maMieszkanca ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "wiadomosci",
      kategoria: "komunikacja",
      ikona: "📢",
      tytul: "Ogłoszenia i wiadomości",
      coDostajaMieszkancy: "Aktualności na profilu wsi i powiadomienia.",
      coRobiSoltys: "Opublikuj wiadomość lub zaakceptuj post mieszkańca.",
      href: "/panel/soltys/wiadomosci-lokalne",
      status: stan.maTresc ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "tablica_szkoly",
      kategoria: "organizacja",
      ikona: "🏫",
      tytul: "Tablica szkoły",
      coDostajaMieszkancy: "Ogłoszenia dla rodziców i uczniów, filtry klas, RSS i kod QR.",
      coRobiSoltys: "Dodaj ogłoszenia w panelu Szkoła; profil placówki w Społeczność (tryb szkoły).",
      href: "/panel/soltys/szkola",
      status: stan.maTablicaSzkoly ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
      wskazowka: stan.maTablicaSzkoly ? undefined : "Włącz moduł szkoły w wyglądzie profilu wsi.",
    },
    {
      id: "zgloszenia",
      kategoria: "bezpieczenstwo",
      ikona: "📋",
      tytul: "Zgłoszenia z mapą",
      coDostajaMieszkancy: "Zgłaszaj problemy z pinezką; pismo do gminy z panelu.",
      coRobiSoltys: "Moderuj statusy w module zgłoszeń.",
      href: "/panel/soltys/zgloszenia",
      status: stan.maZgloszenie ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "rolnictwo",
      kategoria: "organizacja",
      ikona: "🌾",
      tytul: "Rolnictwo i skup",
      coDostajaMieszkancy:
        "Profil rolniczy wsi: ARiMR, dopłaty, skup, ostrzeżenia sezonowe — na /rolnictwo plus ceny GUS.",
      coRobiSoltys: "Uzupełnij profil w module Rolnictwo i włącz sekcję w wyglądzie profilu wsi.",
      href: "/panel/soltys/rolnictwo",
      status: stan.maRolnictwo ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
      wskazowka: stan.maRolnictwo ? undefined : "Ceny GUS ładują się automatycznie po włączeniu modułu.",
    },
    {
      id: "lesnictwo",
      kategoria: "bezpieczenstwo",
      ikona: "🌲",
      tytul: "Leśnictwo i las",
      coDostajaMieszkancy:
        "Profil leśny wsi: choinki, drewno, zakazy wstępu i wycinki — na stronie /lesnictwo i mapie.",
      coRobiSoltys: "Uzupełnij profil LP i publikuj ostrzeżenia leśne z terminem.",
      href: "/panel/soltys/lesnictwo",
      status: stan.maLesnictwo ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "polowania",
      kategoria: "bezpieczenstwo",
      ikona: "🦌",
      tytul: "Polowania na mapie",
      coDostajaMieszkancy: "Czerwony obszar i terminy na mapie publicznej.",
      coRobiSoltys: "Dodaj obszar i daty w module polowania.",
      href: "/panel/soltys/lowiectwo",
      status: stan.maPolowanie ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "kalendarz-lowiecki",
      kategoria: "organizacja",
      ikona: "📅",
      tytul: "Kalendarz łowiecki",
      coDostajaMieszkancy: "Harmonogram ambony i polowań (po zalogowaniu jako mieszkaniec wsi).",
      coRobiSoltys: "Przydziel myśliwych na ambony i terminy w kalendarzu.",
      href: "/panel/soltys/lowiectwo/kalendarz",
      status: stan.maKalendarzLowiecki ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
      wskazowka: stan.maKalendarzLowiecki ? undefined : "Dodaj wpis (ambona, polowanie zbiorowe) w kalendarzu.",
    },
    {
      id: "rezerwacje",
      kategoria: "organizacja",
      ikona: "🏛️",
      tytul: "Rezerwacje świetlicy",
      coDostajaMieszkancy: "Wniosek o salę online, plan sali, checklista.",
      coRobiSoltys: "Zatwierdzaj rezerwacje i ustaw układ sali.",
      href: "/panel/soltys/rezerwacje",
      status: stan.maSale ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
      wskazowka: stan.maSale ? undefined : "Najpierw skonfiguruj salę w module świetlicy.",
    },
    {
      id: "dokumenty",
      kategoria: "organizacja",
      ikona: "📄",
      tytul: "Dokumenty i pisma (PDF)",
      coDostajaMieszkancy: "Profesjonalne pisma do gminy, sponsorów, zaproszenia.",
      coRobiSoltys: "Generator A4 z szablonami — wypełnia dane z profilu.",
      href: "/panel/soltys/dokumenty",
      status: "narzedzie",
      automatyczne: false,
    },
    {
      id: "rynek",
      kategoria: "komunikacja",
      ikona: "🛒",
      tytul: "Rynek lokalny",
      coDostajaMieszkancy: "Ogłoszenia kupna/sprzedaży/wymiany na mapie i profilu.",
      coRobiSoltys: "Moderuj oferty; zachęć mieszkańców do dodawania.",
      href: "/panel/soltys#moderacja-mieszkancow",
      status: stan.maRynek ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "fotokronika",
      kategoria: "komunikacja",
      ikona: "📷",
      tytul: "Fotokronika wsi",
      coDostajaMieszkancy: "Wspólna galeria zdjęć z życia wsi.",
      coRobiSoltys: "Akceptuj zdjęcia od mieszkańców.",
      href: "/panel/soltys/fotokronika",
      status: stan.maFoto ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "rss",
      kategoria: "komunikacja",
      ikona: "📡",
      tytul: "Kanały RSS (gmina, prasa)",
      coDostajaMieszkancy: "Wiadomości z zewnętrznych źródeł na profilu wsi.",
      coRobiSoltys: "Dodaj URL kanału — sync co kilka godzin.",
      href: "/panel/soltys/kanaly-rss",
      status: stan.maRss ? "wlaczone" : "do_uruchomienia",
      automatyczne: true,
    },
    {
      id: "spolecznosc",
      kategoria: "organizacja",
      ikona: "🤝",
      tytul: "Społeczność (KGW, OSP, blog)",
      coDostajaMieszkancy: "Wydarzenia, dyskusje, historia wsi.",
      coRobiSoltys: "Centra KGW/OSP w module społeczności.",
      href: "/panel/soltys/spolecznosc",
      status: stan.maWydarzenie ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
    {
      id: "wspoladmin",
      kategoria: "organizacja",
      ikona: "🧑‍🤝‍🧑",
      tytul: "Współadministrator",
      coDostajaMieszkancy: "—",
      coRobiSoltys: "Zaproś zaufaną osobę do pomocy w panelu.",
      href: "/panel/soltys/zespol",
      status: stan.maWspoladmin ? "wlaczone" : "do_uruchomienia",
      automatyczne: false,
    },
  ];

  const wlaczone = pozycje.filter((p) => p.status === "wlaczone" || p.status === "narzedzie").length;
  const doUruchomienia = pozycje.filter((p) => p.status === "do_uruchomienia").length;

  return {
    pozycje,
    wlaczone,
    doUruchomienia,
    lacznie: pozycje.length,
    transportPlatforma,
  };
}
