import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

export type StanSyncTransportuWsi = {
  lastRealtime: string | null;
  lastBus: string | null;
};

/** Odczyt transport_sync_state (wymaga service role — tylko serwer). */
export async function pobierzStanSyncTransportuDlaWsi(
  villageIds: string[],
): Promise<Record<string, StanSyncTransportuWsi>> {
  const wynik: Record<string, StanSyncTransportuWsi> = {};
  if (villageIds.length === 0) return wynik;

  const admin = createAdminSupabaseClient();
  if (!admin) return wynik;

  const { data: syncRows } = await admin
    .from("transport_sync_state")
    .select("village_id, last_realtime_sync_at, last_bus_sync_at")
    .in("village_id", villageIds);

  for (const s of syncRows ?? []) {
    wynik[s.village_id] = {
      lastRealtime: s.last_realtime_sync_at,
      lastBus: s.last_bus_sync_at,
    };
  }
  return wynik;
}
