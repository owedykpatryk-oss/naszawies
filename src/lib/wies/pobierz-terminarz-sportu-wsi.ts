import type { SupabaseClient } from "@supabase/supabase-js";
import { czyOrganizacjaSport, czySlotHarmonogramuSportowego, czyWydarzenieSportowe, nazwyKlubowSportowych } from "@/lib/wies/sport";

export type KlubSportowyPubliczny = {
  id: string;
  name: string;
  group_type: string;
  short_description: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  profile_data: unknown;
};

export type WydarzenieSportowePubliczne = {
  id: string;
  event_kind: string;
  title: string;
  description: string | null;
  location_text: string | null;
  starts_at: string;
  ends_at: string | null;
  nazwa_grupy: string | null;
};

export type SlotTreninguPubliczny = {
  id: string;
  day_of_week: number;
  time_start: string;
  time_end: string | null;
  title: string;
  description: string | null;
  nazwa_grupy: string | null;
};

export type TerminarzSportuWsi = {
  kluby: KlubSportowyPubliczny[];
  wydarzenia: WydarzenieSportowePubliczne[];
  treningi: SlotTreninguPubliczny[];
  nazwyKlubow: string[];
};

function nazwaGrupy(rel: { name: string } | { name: string }[] | null): string | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0]?.name ?? null;
  return rel.name ?? null;
}

export async function pobierzTerminarzSportuWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<TerminarzSportuWsi> {
  const od = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: grupyRaw }, { data: wydarzeniaRaw }, { data: slotyRaw }] = await Promise.all([
    supabase
      .from("village_community_groups")
      .select(
        "id, name, group_type, short_description, meeting_place, schedule_text, contact_phone, contact_email, profile_data",
      )
      .eq("village_id", villageId)
      .eq("is_active", true),
    supabase
      .from("village_community_events")
      .select("id, title, description, event_kind, location_text, starts_at, ends_at, village_community_groups(name)")
      .eq("village_id", villageId)
      .eq("status", "approved")
      .gte("starts_at", od)
      .order("starts_at", { ascending: true })
      .limit(120),
    supabase
      .from("village_weekly_schedule_slots")
      .select("id, day_of_week, time_start, time_end, title, description, village_community_groups(name)")
      .eq("village_id", villageId)
      .order("day_of_week", { ascending: true })
      .order("time_start", { ascending: true }),
  ]);

  const kluby = (grupyRaw ?? [])
    .filter((g) => czyOrganizacjaSport(String(g.group_type), String(g.name)))
    .map((g) => ({
      id: String(g.id),
      name: String(g.name),
      group_type: String(g.group_type),
      short_description: (g.short_description as string | null) ?? null,
      meeting_place: (g.meeting_place as string | null) ?? null,
      schedule_text: (g.schedule_text as string | null) ?? null,
      contact_phone: (g.contact_phone as string | null) ?? null,
      contact_email: (g.contact_email as string | null) ?? null,
      profile_data: g.profile_data,
    }));

  const nazwy = nazwyKlubowSportowych(kluby);

  const wydarzenia = (wydarzeniaRaw ?? [])
    .filter((w) =>
      czyWydarzenieSportowe(
        String((w as { event_kind: string }).event_kind),
        nazwaGrupy((w as { village_community_groups: { name: string } | { name: string }[] | null }).village_community_groups),
        nazwy,
      ),
    )
    .map((w) => {
      const row = w as {
        id: string;
        title: string;
        description: string | null;
        event_kind: string;
        location_text: string | null;
        starts_at: string;
        ends_at: string | null;
        village_community_groups: { name: string } | { name: string }[] | null;
      };
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        event_kind: row.event_kind,
        location_text: row.location_text,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        nazwa_grupy: nazwaGrupy(row.village_community_groups),
      };
    });

  const treningi = (slotyRaw ?? [])
    .filter((s) =>
      czySlotHarmonogramuSportowego(
        nazwaGrupy((s as { village_community_groups: { name: string } | { name: string }[] | null }).village_community_groups),
        nazwy,
      ),
    )
    .map((s) => {
      const row = s as {
        id: string;
        day_of_week: number;
        time_start: string;
        time_end: string | null;
        title: string;
        description: string | null;
        village_community_groups: { name: string } | { name: string }[] | null;
      };
      return {
        id: row.id,
        day_of_week: row.day_of_week,
        time_start: row.time_start,
        time_end: row.time_end,
        title: row.title,
        description: row.description,
        nazwa_grupy: nazwaGrupy(row.village_community_groups),
      };
    });

  return { kluby, wydarzenia, treningi, nazwyKlubow: nazwy };
}

/** Najbliższe wydarzenie sportowe (mecz lub trening jednorazowy). */
export function znajdzNastepneWydarzenieSportowe(
  wydarzenia: WydarzenieSportowePubliczne[],
  teraz = Date.now(),
): WydarzenieSportowePubliczne | null {
  for (const w of wydarzenia) {
    if (new Date(w.starts_at).getTime() >= teraz) return w;
  }
  return null;
}
