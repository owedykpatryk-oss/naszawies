import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { etykietaRodzajuWydarzenia, etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";

const TYPY_ORGANIZACJI = ["parafia", "kgw", "osp", "sport"] as const;

export type MojaOrganizacja = {
  id: string;
  group_type: string;
  name: string;
  short_description: string | null;
  nazwaWsi: string;
  sciezkaProfilu: string;
};

export type MojeWydarzenieOrganizacji = {
  id: string;
  title: string;
  starts_at: string;
  event_kind: string;
  nazwaGrupy: string | null;
  nazwaWsi: string;
  href: string;
};

export async function pobierzMojeOrganizacje(villageIds: string[]) {
  if (villageIds.length === 0) {
    return { organizacje: [] as MojaOrganizacja[], wydarzenia: [] as MojeWydarzenieOrganizacji[] };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const od = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: orgRaw }, { data: wydRaw }, { data: wsieRaw }] = await Promise.all([
    supabase
      .from("village_community_groups")
      .select("id, group_type, name, short_description, village_id, villages(name, slug, voivodeship, county, commune)")
      .in("village_id", villageIds)
      .in("group_type", [...TYPY_ORGANIZACJI])
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("village_community_events")
      .select(
        "id, title, event_kind, starts_at, village_id, village_community_groups(name), villages(name, slug, voivodeship, county, commune)",
      )
      .in("village_id", villageIds)
      .eq("status", "approved")
      .gte("starts_at", od)
      .order("starts_at", { ascending: true })
      .limit(40),
    supabase.from("villages").select("id, name, slug, voivodeship, county, commune").in("id", villageIds),
  ]);

  const mapaNazw = new Map((wsieRaw ?? []).map((v) => [v.id, v.name]));

  const organizacje: MojaOrganizacja[] = (orgRaw ?? []).map((o) => {
    const v = pojedynczaWies<{
      name: string;
      slug: string;
      voivodeship: string;
      county: string;
      commune: string;
    }>(o.villages);
    const sciezka = v ? sciezkaProfiluWsi(v) : "#";
    return {
      id: o.id,
      group_type: o.group_type,
      name: o.name,
      short_description: o.short_description,
      nazwaWsi: v?.name ?? mapaNazw.get(o.village_id) ?? "—",
      sciezkaProfilu: sciezka,
    };
  });

  type WydRaw = {
    id: string;
    title: string;
    event_kind: string;
    starts_at: string;
    village_id: string;
    village_community_groups: { name: string } | { name: string }[] | null;
    villages: {
      name: string;
      slug: string;
      voivodeship: string;
      county: string;
      commune: string;
    } | null;
  };

  const wydarzenia: MojeWydarzenieOrganizacji[] = ((wydRaw ?? []) as unknown as WydRaw[]).map((ev) => {
    const v = pojedynczaWies<{
      name: string;
      slug: string;
      voivodeship: string;
      county: string;
      commune: string;
    }>(ev.villages);
    const sciezka = v ? sciezkaProfiluWsi(v) : "#";
    const rel = ev.village_community_groups;
    const ng = rel == null ? null : Array.isArray(rel) ? rel[0]?.name ?? null : rel.name ?? null;
    return {
      id: ev.id,
      title: ev.title,
      starts_at: ev.starts_at,
      event_kind: ev.event_kind,
      nazwaGrupy: ng,
      nazwaWsi: v?.name ?? mapaNazw.get(ev.village_id) ?? "—",
      href: `${sciezka}/wydarzenia/${ev.id}`,
    };
  });

  return { organizacje, wydarzenia };
}

export function etykietaSekcjiOrganizacji(typ: string): string {
  return etykietaTypuGrupy(typ);
}

export { etykietaRodzajuWydarzenia };
