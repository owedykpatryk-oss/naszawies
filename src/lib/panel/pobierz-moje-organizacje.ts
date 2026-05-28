import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import {
  parsujProfilParafii,
  parsujProfilKgw,
  parsujProfilLowiecki,
  czyProfilParafiiUzupelniony,
  czyProfilKgwUzupelniony,
  czyProfilLowieckiUzupelniony,
} from "@/lib/wies/profil-organizacji";
import { etykietaRodzajuWydarzenia, etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";

const TYPY_ORGANIZACJI = ["parafia", "kgw", "osp", "sport", "lowiectwo"] as const;

export type MojaOrganizacja = {
  id: string;
  group_type: string;
  name: string;
  short_description: string | null;
  nazwaWsi: string;
  sciezkaProfilu: string;
  contact_phone: string | null;
  contact_email: string | null;
  mszeSkrot: string | null;
  zebraniaSkrot: string | null;
  obszarSkrot: string | null;
  profilUzupelniony: boolean;
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
      .select(
        "id, group_type, name, short_description, contact_phone, contact_email, profile_data, village_id, villages(name, slug, voivodeship, county, commune)",
      )
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
    const profilParafii = o.group_type === "parafia" ? parsujProfilParafii(o.profile_data) : null;
    const profilKgw = o.group_type === "kgw" ? parsujProfilKgw(o.profile_data) : null;
    const profilLow = o.group_type === "lowiectwo" ? parsujProfilLowiecki(o.profile_data) : null;
    const mszeSkrot =
      profilParafii?.msze_niedziele?.trim() ||
      profilParafii?.msze_dni_powszednie?.trim() ||
      null;
    const zebraniaSkrot = profilKgw?.zebrania?.trim() || null;
    const obszarSkrot = profilLow?.obszar_lowiecki?.trim()?.slice(0, 120) || null;
    const sciezkaProfilu =
      o.group_type === "parafia"
        ? `${sciezka}#parafia`
        : o.group_type === "kgw"
          ? `${sciezka}#kgw`
          : o.group_type === "lowiectwo"
            ? `${sciezka}#mysliwi`
            : sciezka;
    return {
      id: o.id,
      group_type: o.group_type,
      name: o.name,
      short_description: o.short_description,
      nazwaWsi: v?.name ?? mapaNazw.get(o.village_id) ?? "—",
      sciezkaProfilu,
      contact_phone: o.contact_phone,
      contact_email: o.contact_email,
      mszeSkrot,
      zebraniaSkrot,
      obszarSkrot,
      profilUzupelniony:
        o.group_type === "parafia"
          ? czyProfilParafiiUzupelniony(profilParafii)
          : o.group_type === "kgw"
            ? czyProfilKgwUzupelniony(profilKgw)
            : o.group_type === "lowiectwo"
              ? czyProfilLowieckiUzupelniony(profilLow)
              : true,
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
