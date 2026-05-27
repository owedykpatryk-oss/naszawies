import { etykietaRoliWsi } from "@/lib/panel/role-definicje";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import {
  sciezkaGminy,
  sciezkaPowiatu,
  sciezkaProfiluWsi,
  sciezkaWojewodztwa,
} from "@/lib/wies/sciezka-publiczna";

export type WiesPowiazana = {
  villageId: string;
  nazwa: string;
  sciezkaProfilu: string;
  sciezkaGminy: string;
  sciezkaPowiatu: string;
  sciezkaWojewodztwa: string;
  wojewodztwo: string;
  powiat: string;
  gmina: string;
  /** Aktywna rola w wsi (jeśli jest). */
  rola: string | null;
  etykietaRoli: string | null;
  statusRoli: string | null;
  /** Obserwacja bez członkostwa. */
  followId: string | null;
  notify_posts: boolean;
  notify_events: boolean;
  notify_issues: boolean;
  notify_alerts: boolean;
};

export type GminaPowiazana = {
  klucz: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  sciezkaHub: string;
  wies: WiesPowiazana[];
};

export type PowiatPowiazany = {
  klucz: string;
  powiat: string;
  wojewodztwo: string;
  sciezkaHub: string;
  gminy: GminaPowiazana[];
};

export type RelacjaTransportowa = {
  id: string;
  title: string;
  target_label: string | null;
  village_id: string;
};

/** Obserwowana gmina bez przypisanej wsi (osobna tabela). */
export type GminaObserwowana = {
  followId: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  sciezkaHub: string;
  notify_posts: boolean;
  notify_events: boolean;
};

export type ZapisanaTresc = {
  id: string;
  content_type: "post" | "event";
  content_id: string;
  title_cache: string;
  href_cache: string;
  village_id: string;
  nazwaWsi: string;
  created_at: string;
};

export type MojePowiazania = {
  userId: string;
  wies: WiesPowiazana[];
  gminy: GminaPowiazana[];
  powiaty: PowiatPowiazany[];
  wojewodztwa: { wojewodztwo: string; sciezkaHub: string; wies: WiesPowiazana[] }[];
  relacjeTransportowe: RelacjaTransportowa[];
  /** Gminy obserwowane bez konieczności posiadania wsi w tej gminie. */
  gminyObserwowane: GminaObserwowana[];
  zapisaneTresci: ZapisanaTresc[];
  /** Unikalne ID wsi do feedu (role + obserwacje + wsie z obserwowanych gmin). */
  villageIdsFeed: string[];
  liczbaNieprzeczytanychPowiadomien: number;
  aktywneRole: number;
  oczekujaceRole: number;
  liczbaObserwacji: number;
  liczbaGminObserwowanych: number;
  liczbaZapisanychTresci: number;
};

type WiesBaza = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
};

function zWierszaWsi(
  v: WiesBaza,
  extra: Partial<WiesPowiazana> & Pick<WiesPowiazana, "villageId" | "nazwa">,
): WiesPowiazana {
  const sciezka = {
    voivodeship: v.voivodeship,
    county: v.county,
    commune: v.commune,
    slug: v.slug,
  };
  return {
    villageId: extra.villageId,
    nazwa: extra.nazwa,
    sciezkaProfilu: sciezkaProfiluWsi(sciezka),
    sciezkaGminy: sciezkaGminy(v),
    sciezkaPowiatu: sciezkaPowiatu(v),
    sciezkaWojewodztwa: sciezkaWojewodztwa(v.voivodeship),
    wojewodztwo: v.voivodeship,
    powiat: v.county,
    gmina: v.commune,
    rola: extra.rola ?? null,
    etykietaRoli: extra.etykietaRoli ?? null,
    statusRoli: extra.statusRoli ?? null,
    followId: extra.followId ?? null,
    notify_posts: extra.notify_posts ?? true,
    notify_events: extra.notify_events ?? true,
    notify_issues: extra.notify_issues ?? false,
    notify_alerts: extra.notify_alerts ?? true,
  };
}

/** Agreguje wsie użytkownika (role + obserwacje) oraz jednostki samorządowe. */
export async function pobierzMojePowiazania(): Promise<MojePowiazania | null> {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("id, role, status, village_id, villages (id, name, slug, voivodeship, county, commune)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: followRows } = await supabase
    .from("user_follows")
    .select(
      "id, village_id, notify_posts, notify_events, notify_issues, notify_alerts, villages (id, name, slug, voivodeship, county, commune)",
    )
    .eq("user_id", user.id);

  const { count: nieprzeczytane } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const { data: transportRaw } = await supabase
    .from("user_transport_favorite_relations")
    .select("id, title, target_label, village_id")
    .eq("user_id", user.id)
    .order("title");

  const { data: communeFollowRaw } = await supabase
    .from("user_commune_follows")
    .select("id, voivodeship, county, commune, notify_posts, notify_events")
    .eq("user_id", user.id)
    .order("commune");

  const { data: savedRaw } = await supabase
    .from("user_saved_content")
    .select("id, content_type, content_id, title_cache, href_cache, village_id, created_at, villages(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  const mapaWsi = new Map<string, WiesPowiazana>();

  for (const r of roleRows ?? []) {
    const v = pojedynczaWies<WiesBaza>(r.villages);
    if (!v) continue;
    const istniejace = mapaWsi.get(v.id);
    mapaWsi.set(
      v.id,
      zWierszaWsi(v, {
        villageId: v.id,
        nazwa: v.name,
        rola: r.role,
        etykietaRoli: etykietaRoliWsi(r.role),
        statusRoli: r.status,
        followId: istniejace?.followId ?? null,
        notify_posts: istniejace?.notify_posts ?? true,
        notify_events: istniejace?.notify_events ?? true,
        notify_issues: istniejace?.notify_issues ?? false,
        notify_alerts: istniejace?.notify_alerts ?? true,
      }),
    );
  }

  for (const f of followRows ?? []) {
    const v = pojedynczaWies<WiesBaza>(f.villages);
    if (!v) continue;
    const istniejace = mapaWsi.get(v.id);
    if (istniejace) {
      mapaWsi.set(v.id, {
        ...istniejace,
        followId: f.id,
        notify_posts: Boolean(f.notify_posts),
        notify_events: Boolean(f.notify_events),
        notify_issues: Boolean(f.notify_issues),
        notify_alerts: Boolean(f.notify_alerts),
      });
    } else {
      mapaWsi.set(
        v.id,
        zWierszaWsi(v, {
          villageId: v.id,
          nazwa: v.name,
          followId: f.id,
          notify_posts: Boolean(f.notify_posts),
          notify_events: Boolean(f.notify_events),
          notify_issues: Boolean(f.notify_issues),
          notify_alerts: Boolean(f.notify_alerts),
        }),
      );
    }
  }

  const wies = Array.from(mapaWsi.values()).sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));

  const mapaGmin = new Map<string, GminaPowiazana>();
  for (const w of wies) {
    const klucz = `${w.wojewodztwo}|${w.powiat}|${w.gmina}`;
    const g = mapaGmin.get(klucz) ?? {
      klucz,
      gmina: w.gmina,
      powiat: w.powiat,
      wojewodztwo: w.wojewodztwo,
      sciezkaHub: w.sciezkaGminy,
      wies: [],
    };
    g.wies.push(w);
    mapaGmin.set(klucz, g);
  }
  const gminy = Array.from(mapaGmin.values()).sort((a, b) => a.gmina.localeCompare(b.gmina, "pl"));

  const mapaPowiatow = new Map<string, PowiatPowiazany>();
  for (const g of gminy) {
    const klucz = `${g.wojewodztwo}|${g.powiat}`;
    const p = mapaPowiatow.get(klucz) ?? {
      klucz,
      powiat: g.powiat,
      wojewodztwo: g.wojewodztwo,
      sciezkaHub: sciezkaPowiatu({ voivodeship: g.wojewodztwo, county: g.powiat }),
      gminy: [],
    };
    p.gminy.push(g);
    mapaPowiatow.set(klucz, p);
  }
  const powiaty = Array.from(mapaPowiatow.values()).sort((a, b) => a.powiat.localeCompare(b.powiat, "pl"));

  const mapaWoj = new Map<string, { wojewodztwo: string; sciezkaHub: string; wies: WiesPowiazana[] }>();
  for (const w of wies) {
    const woj = mapaWoj.get(w.wojewodztwo) ?? {
      wojewodztwo: w.wojewodztwo,
      sciezkaHub: w.sciezkaWojewodztwa,
      wies: [],
    };
    woj.wies.push(w);
    mapaWoj.set(w.wojewodztwo, woj);
  }
  const wojewodztwa = Array.from(mapaWoj.values()).sort((a, b) => a.wojewodztwo.localeCompare(b.wojewodztwo, "pl"));

  const aktywneRole = (roleRows ?? []).filter((r) => r.status === "active").length;
  const oczekujaceRole = (roleRows ?? []).filter((r) => r.status === "pending").length;

  const gminyObserwowane: GminaObserwowana[] = (communeFollowRaw ?? []).map((r) => ({
    followId: r.id,
    gmina: r.commune,
    powiat: r.county,
    wojewodztwo: r.voivodeship,
    sciezkaHub: sciezkaGminy({ voivodeship: r.voivodeship, county: r.county, commune: r.commune }),
    notify_posts: Boolean(r.notify_posts),
    notify_events: Boolean(r.notify_events),
  }));

  const zapisaneTresci: ZapisanaTresc[] = (savedRaw ?? []).map((r) => {
    const v = pojedynczaWies<{ name: string }>(r.villages);
    return {
      id: r.id,
      content_type: r.content_type as "post" | "event",
      content_id: r.content_id,
      title_cache: r.title_cache,
      href_cache: r.href_cache,
      village_id: r.village_id,
      nazwaWsi: v?.name ?? "—",
      created_at: r.created_at,
    };
  });

  const villageIdsFeed = new Set(wies.map((w) => w.villageId));
  for (const g of gminyObserwowane) {
    const { data: wsieGminy } = await supabase
      .from("villages")
      .select("id")
      .eq("voivodeship", g.wojewodztwo)
      .eq("county", g.powiat)
      .eq("commune", g.gmina)
      .limit(120);
    for (const row of wsieGminy ?? []) {
      villageIdsFeed.add(row.id);
    }
  }

  return {
    userId: user.id,
    wies,
    gminy,
    powiaty,
    wojewodztwa,
    relacjeTransportowe: (transportRaw ?? []) as RelacjaTransportowa[],
    gminyObserwowane,
    zapisaneTresci,
    villageIdsFeed: Array.from(villageIdsFeed),
    liczbaNieprzeczytanychPowiadomien: nieprzeczytane ?? 0,
    aktywneRole,
    oczekujaceRole,
    liczbaObserwacji: (followRows ?? []).length,
    liczbaGminObserwowanych: gminyObserwowane.length,
    liczbaZapisanychTresci: zapisaneTresci.length,
  };
}
