import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import type { RelacjaTransportowa, WiesPowiazana } from "@/lib/panel/pobierz-moje-powiazania";

export type AlertTransportuMoje = {
  relationId: string;
  title: string;
  targetLabel: string | null;
  nazwaWsi: string;
  sciezkaProfilu: string;
  statusLabel: string;
  statusColor: string;
  delayedCount: number;
  cancelledCount: number;
};

/** Ulubione relacje transportowe z alertem (opóźnienia / linia w stanie ostrzegawczym). */
export async function pobierzSkrotTransportuMoje(
  relacje: RelacjaTransportowa[],
  wies: WiesPowiazana[],
): Promise<AlertTransportuMoje[]> {
  if (relacje.length === 0) return [];

  const mapaWsi = new Map(wies.map((w) => [w.villageId, w]));
  const villageIds = Array.from(new Set(relacje.map((r) => r.village_id)));

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: statusy } = await supabase
    .from("village_transport_line_status")
    .select("village_id, status_color, status_label, delayed_count, cancelled_count")
    .in("village_id", villageIds);

  const mapaStatusu = new Map((statusy ?? []).map((s) => [s.village_id, s]));
  const out: AlertTransportuMoje[] = [];

  for (const r of relacje) {
    const st = mapaStatusu.get(r.village_id);
    if (!st) continue;
    const kolor = st.status_color ?? "green";
    const opoznienia = st.delayed_count ?? 0;
    const anulowane = st.cancelled_count ?? 0;
    if (kolor === "green" && opoznienia === 0 && anulowane === 0) continue;

    const w = mapaWsi.get(r.village_id);
    out.push({
      relationId: r.id,
      title: r.title,
      targetLabel: r.target_label,
      nazwaWsi: w?.nazwa ?? "Twoja wieś",
      sciezkaProfilu: w?.sciezkaProfilu ?? "#",
      statusLabel: st.status_label ?? "Uwaga na linii",
      statusColor: kolor,
      delayedCount: opoznienia,
      cancelledCount: anulowane,
    });
  }

  return out.slice(0, 6);
}
