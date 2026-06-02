import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type RodzajWpisuKalendarzaLowieckiego,
  type WpisKalendarzaLowieckiego,
} from "@/lib/lowiectwo/kalendarz-lowiecki";

type Row = {
  id: string;
  village_id: string;
  entry_kind: string;
  title: string;
  starts_at: string;
  ends_at: string;
  poi_id: string | null;
  stand_label: string | null;
  hunter_name: string | null;
  hunter_phone: string | null;
  notes: string | null;
  hunting_notice_id: string | null;
  pois: { name: string } | { name: string }[] | null;
};

function nazwaPoi(pois: Row["pois"]): string | null {
  if (!pois) return null;
  const p = Array.isArray(pois) ? pois[0] : pois;
  return p?.name?.trim() || null;
}

function mapujWiersz(r: Row, nazwyWsi: Record<string, string>): WpisKalendarzaLowieckiego {
  const ambona = nazwaPoi(r.pois);
  return {
    id: r.id,
    villageId: r.village_id,
    wiesNazwa: nazwyWsi[r.village_id] ?? "—",
    entryKind: r.entry_kind as RodzajWpisuKalendarzaLowieckiego,
    title: r.title,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    poiId: r.poi_id,
    standLabel: r.stand_label,
    ambonaNazwa: ambona ?? r.stand_label,
    hunterName: r.hunter_name,
    hunterPhone: r.hunter_phone,
    notes: r.notes,
    huntingNoticeId: r.hunting_notice_id,
  };
}

export async function pobierzKalendarzLowieckiDlaWsi(
  supabase: SupabaseClient,
  villageIds: string[],
  od: Date,
  doDaty: Date,
  nazwyWsi: Record<string, string>,
): Promise<WpisKalendarzaLowieckiego[]> {
  if (villageIds.length === 0) return [];

  const { data, error } = await supabase
    .from("village_hunting_schedule_entries")
    .select(
      "id, village_id, entry_kind, title, starts_at, ends_at, poi_id, stand_label, hunter_name, hunter_phone, notes, hunting_notice_id, pois(name)",
    )
    .in("village_id", villageIds)
    .gte("ends_at", od.toISOString())
    .lte("starts_at", doDaty.toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[pobierzKalendarzLowieckiDlaWsi]", error.message);
    return [];
  }

  return ((data ?? []) as Row[]).map((r) => mapujWiersz(r, nazwyWsi));
}

/** Nadchodzące wpisy na profilu wsi (mieszkańcy — pełne imiona; gość — pusty). */
export async function pobierzHarmonogramLowieckiProfilWsi(
  supabase: SupabaseClient,
  villageId: string,
  limit = 12,
): Promise<WpisKalendarzaLowieckiego[]> {
  const teraz = new Date();
  const za60dni = new Date(teraz);
  za60dni.setDate(za60dni.getDate() + 60);

  const { data, error } = await supabase
    .from("village_hunting_schedule_entries")
    .select(
      "id, village_id, entry_kind, title, starts_at, ends_at, poi_id, stand_label, hunter_name, hunter_phone, notes, hunting_notice_id, pois(name)",
    )
    .eq("village_id", villageId)
    .gte("ends_at", teraz.toISOString())
    .lte("starts_at", za60dni.toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) return [];

  return ((data ?? []) as Row[]).map((r) => mapujWiersz(r, { [villageId]: "" }));
}
