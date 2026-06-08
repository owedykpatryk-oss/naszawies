import type { Metadata } from "next";
import { OrganizacjaStronaKlient } from "@/components/wies/organizacja/organizacja-strona-klient";
import {
  OrganizacjaTrescPubliczna,
  OrganizacjaZakladkaKalendarz,
  OrganizacjaZakladkaKontakt,
  OrganizacjaZakladkaMieszkancow,
  OrganizacjaZakladkaStart,
} from "@/components/wies/organizacja/organizacja-tresc-publiczna";
import { pobierzHarmonogramLowieckiProfilWsi } from "@/lib/lowiectwo/pobierz-kalendarz-harmonogram";
import { motywOrganizacji } from "@/lib/wies/motyw-organizacji-publicznej";
import {
  hasloOrganizacjiZProfilu,
  okladkaOrganizacjiZProfilu,
} from "@/lib/wies/profil-organizacji-meta";
import {
  parsujProfilKgw,
  parsujProfilLowiecki,
  parsujProfilOsp,
  parsujProfilParafii,
  parsujProfilRolnikow,
  parsujProfilSzkoly,
  parsujRewirGeojsonZProfilu,
} from "@/lib/wies/profil-organizacji";
import { parsujProfilKlubuSportowego } from "@/lib/wies/profil-klubu-sportowego";
import type { WierszOrganizacjiPublicznej } from "@/lib/wies/pobierz-strone-organizacji";
import {
  sciezkaStronyOrganizacji,
  slugPublicznyOrganizacji,
  type SegmentOrganizacji,
} from "@/lib/wies/sciezka-organizacji-publicznej";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import {
  czyWydarzenieKgw,
  czyWydarzenieLowieckie,
  czyWydarzenieOsp,
  czyWydarzenieParafialne,
} from "@/lib/wies/teksty-organizacji";
import { czyWydarzenieSportowe } from "@/lib/wies/sport";
import type { HeroMapaOrganizacji, LinkiMapyOrganizacji } from "@/lib/wies/poi-organizacji-hero";
import type { SupabaseClient } from "@supabase/supabase-js";
import { OrganizacjaJsonLd } from "@/components/wies/organizacja/organizacja-json-ld";

type WiesPubliczna = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

type WydarzenieRow = {
  id: string;
  event_kind: string;
  title: string;
  location_text: string | null;
  starts_at: string;
  ends_at: string | null;
  description: string | null;
  group_id: string | null;
  village_community_groups: { name: string } | { name: string }[] | null;
};

function nazwaGrupy(g: WydarzenieRow["village_community_groups"]): string | null {
  if (!g) return null;
  const row = Array.isArray(g) ? g[0] : g;
  return row?.name?.trim() || null;
}

function filtrujWydarzenia(
  segment: SegmentOrganizacji,
  org: WierszOrganizacjiPublicznej,
  rows: WydarzenieRow[],
): WydarzenieRow[] {
  const nazwa = org.name;
  return rows.filter((w) => {
    if (w.group_id === org.id) return true;
    const gn = nazwaGrupy(w.village_community_groups);
    switch (segment) {
      case "kgw":
        return czyWydarzenieKgw(w.event_kind, gn, nazwa);
      case "parafia":
        return czyWydarzenieParafialne(w.event_kind, gn, nazwa);
      case "lowiectwo":
        return czyWydarzenieLowieckie(w.event_kind, gn, nazwa);
      case "osp":
        return czyWydarzenieOsp(w.event_kind, gn, nazwa);
      case "sport":
        return czyWydarzenieSportowe(w.event_kind, gn, [nazwa]);
      default:
        return gn?.toLowerCase() === nazwa.toLowerCase();
    }
  });
}

function podtytulOrganizacji(segment: SegmentOrganizacji, org: WierszOrganizacjiPublicznej): string | null {
  const pd = org.profile_data;
  if (segment === "kgw") {
    const p = parsujProfilKgw(pd);
    if (p?.przewodniczaca) return `Przewodnicząca: ${p.przewodniczaca}`;
  }
  if (segment === "parafia") {
    const p = parsujProfilParafii(pd);
    if (p?.proboszcz) return `Proboszcz: ${p.proboszcz}`;
  }
  if (segment === "lowiectwo") {
    const p = parsujProfilLowiecki(pd);
    if (p?.lowczy) return `Łowczy: ${p.lowczy}`;
    if (p?.prezes) return `Prezes: ${p.prezes}`;
  }
  if (segment === "osp") {
    const p = parsujProfilOsp(pd);
    if (p?.naczelnik) return `Naczelnik: ${p.naczelnik}`;
  }
  if (segment === "sport") {
    const p = parsujProfilKlubuSportowego(pd);
    if (p?.trener) return `Trener: ${p.trener}`;
    if (p?.dyscyplina) return p.dyscyplina;
  }
  if (segment === "szkola") {
    const p = parsujProfilSzkoly(pd);
    if (p?.dyrektor) return `Dyrektor: ${p.dyrektor}`;
  }
  if (segment === "rolnicy") {
    const p = parsujProfilRolnikow(pd);
    if (p?.przewodniczacy) return `Przewodniczący: ${p.przewodniczacy}`;
  }
  return null;
}

export async function pobierzWydarzeniaOrganizacji(
  supabase: SupabaseClient,
  villageId: string,
): Promise<WydarzenieRow[]> {
  const od = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("village_community_events")
    .select(
      "id, event_kind, title, location_text, starts_at, ends_at, description, group_id, village_community_groups(name)",
    )
    .eq("village_id", villageId)
    .eq("status", "approved")
    .gte("starts_at", od)
    .order("starts_at", { ascending: true })
    .limit(80);
  return (data ?? []) as WydarzenieRow[];
}

export function metadataStronyOrganizacji(
  wies: WiesPubliczna,
  org: WierszOrganizacjiPublicznej,
  segment: SegmentOrganizacji,
): Metadata {
  const motyw = motywOrganizacji(segment);
  const sciezka = sciezkaStronyOrganizacji(
    wies,
    segment,
    slugPublicznyOrganizacji(org.name, org.id, org.public_slug),
  );
  const opis =
    org.short_description?.slice(0, 160) ??
    `${motyw.etykietaTypu} w miejscowości ${wies.name}. Kontakt, kalendarz i informacje.`;
  const okladka = okladkaOrganizacjiZProfilu(org.profile_data);
  return {
    title: `${org.name} — ${motyw.etykietaTypu} · ${wies.name}`,
    description: opis,
    alternates: { canonical: sciezka },
    openGraph: {
      title: `${org.name} — ${motyw.etykietaTypu}`,
      description: opis,
      url: sciezka,
      type: "website",
      images: okladka ? [{ url: okladka, alt: org.name }] : undefined,
    },
    twitter: {
      card: okladka ? "summary_large_image" : "summary",
      title: `${org.name} · ${wies.name}`,
      description: opis,
      images: okladka ? [okladka] : undefined,
    },
  };
}

type KontekstStrony = {
  zalogowany: boolean;
  mieszkaniecWsi: boolean;
  harmonogramLowiecki: Awaited<ReturnType<typeof pobierzHarmonogramLowieckiProfilWsi>>;
  ostrzezeniaLowieckie?: {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    maObszarMapy: boolean;
  }[];
  heroMapaPunkt?: HeroMapaOrganizacji | null;
  linkiMapy?: LinkiMapyOrganizacji;
  linkPlanCmentarza?: string | null;
};

export function StronaOrganizacjiPubliczna({
  wies,
  org,
  segment,
  wydarzeniaSurowe,
  kontekst,
  siteUrl,
}: {
  wies: WiesPubliczna;
  org: WierszOrganizacjiPublicznej;
  segment: SegmentOrganizacji;
  wydarzeniaSurowe: WydarzenieRow[];
  kontekst: KontekstStrony;
  siteUrl: string;
}) {
  const motyw = motywOrganizacji(segment);
  const sciezkaWsi = sciezkaProfiluWsi(wies);
  const urlStrony = sciezkaStronyOrganizacji(
    wies,
    segment,
    slugPublicznyOrganizacji(org.name, org.id, org.public_slug),
  );
  const sciezkaWydarzenia = `${sciezkaWsi}/wydarzenia`;
  const wydarzenia = filtrujWydarzenia(segment, org, wydarzeniaSurowe);
  const nadchodzace = wydarzenia.filter((w) => new Date(w.ends_at ?? w.starts_at) >= new Date());

  const statystyki: { etykieta: string; wartosc: string }[] = [];
  if (nadchodzace.length > 0) {
    statystyki.push({
      etykieta: "Następne",
      wartosc: new Date(nadchodzace[0]!.starts_at).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      }),
    });
  }
  if (org.meeting_place) statystyki.push({ etykieta: "Miejsce", wartosc: org.meeting_place.slice(0, 40) });

  const linki = kontekst.linkiMapy ?? {};

  const propsTresci = {
    segment,
    org,
    sciezkaWsi,
    sciezkaWydarzenia,
    sciezkaDotacje: `${sciezkaWsi}/dotacje`,
    sciezkaRynek: `${sciezkaWsi}/rynek`,
    wydarzenia,
    zalogowany: kontekst.zalogowany,
    mieszkaniecWsi: kontekst.mieszkaniecWsi,
    harmonogramLowiecki: kontekst.harmonogramLowiecki,
    ostrzezeniaLowieckie: kontekst.ostrzezeniaLowieckie,
    linkMiejsceNaMapie: linki.linkMiejsceNaMapie ?? kontekst.heroMapaPunkt?.linkPelnaMapa ?? null,
    linkKosciolNaMapie: linki.linkKosciolNaMapie ?? null,
    linkCmentarzNaMapie: linki.linkCmentarzNaMapie ?? null,
    linkRemizaNaMapie: linki.linkRemizaNaMapie ?? null,
    linkBoiskoNaMapie: linki.linkBoiskoNaMapie ?? null,
    linkPlanCmentarza: kontekst.linkPlanCmentarza ?? null,
  };

  const okladkaUrl = okladkaOrganizacjiZProfilu(org.profile_data);
  const haslo = hasloOrganizacjiZProfilu(org.profile_data);
  const pokazZakladkeMieszkancow = segment === "lowiectwo";
  const rewirGeojson =
    segment === "lowiectwo" ? parsujRewirGeojsonZProfilu(org.profile_data) : null;

  return (
    <main className="mx-auto min-w-0 w-full max-w-4xl px-4 py-10 text-stone-800 sm:px-6 sm:py-14">
      <OrganizacjaJsonLd
        wies={wies}
        org={org}
        segment={segment}
        urlStrony={urlStrony}
        siteUrl={siteUrl}
        wydarzenia={wydarzenia.map((w) => ({
          title: w.title,
          starts_at: w.starts_at,
          location_text: w.location_text,
        }))}
      />
      <OrganizacjaStronaKlient
        motyw={motyw}
        nazwa={org.name}
        podtytul={podtytulOrganizacji(segment, org)}
        opisKrotki={org.short_description}
        haslo={haslo}
        okladkaUrl={okladkaUrl}
        sciezkaWsi={sciezkaWsi}
        nazwaWsi={wies.name}
        urlStrony={urlStrony}
        statystyki={statystyki}
        telefon={org.contact_phone}
        email={org.contact_email}
        pokazZakladkeMieszkancow={pokazZakladkeMieszkancow}
        rewirGeojson={rewirGeojson}
        linkMapyLowiectwa="/mapa?warstwa=lowiectwo"
        heroMapaPunkt={kontekst.heroMapaPunkt ?? null}
        zakladkaStart={
          <OrganizacjaZakladkaStart
            org={org}
            segment={segment}
            wydarzenia={wydarzenia}
            sciezkaWydarzenia={sciezkaWydarzenia}
            linkMiejsceNaMapie={kontekst.heroMapaPunkt?.linkPelnaMapa ?? linki.linkMiejsceNaMapie ?? null}
            etykietaLinkMapy={kontekst.heroMapaPunkt?.etykietaLink ?? null}
            linkCmentarzNaMapie={linki.linkCmentarzNaMapie ?? null}
            linkPlanCmentarza={kontekst.linkPlanCmentarza ?? null}
          />
        }
        zakladkaONas={<OrganizacjaTrescPubliczna {...propsTresci} />}
        zakladkaKalendarz={<OrganizacjaZakladkaKalendarz {...propsTresci} />}
        zakladkaKontakt={<OrganizacjaZakladkaKontakt org={org} />}
        zakladkaMieszkancow={<OrganizacjaZakladkaMieszkancow {...propsTresci} />}
      />
    </main>
  );
}
