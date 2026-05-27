import type { SupabaseClient } from "@supabase/supabase-js";

export type ZajetyAsortyment = { inventoryId: string; quantitySum: number };

/** Ile sztuk asortymentu jest już zarezerwowanych w nakładającym się terminie. */
export async function pobierzZajetyAsortymentWPrzedziale(
  supabase: SupabaseClient,
  hallId: string,
  startIso: string,
  endIso: string,
  excludeBookingId?: string | null,
): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("hall_inventory_zajete_w_przedziale", {
    p_hall_id: hallId,
    p_start: startIso,
    p_end: endIso,
    p_exclude_booking_id: excludeBookingId ?? null,
  });

  const mapa = new Map<string, number>();
  if (error) {
    console.warn("[pobierzZajetyAsortymentWPrzedziale]", error.message);
    return mapa;
  }

  for (const row of data ?? []) {
    const id = (row as { inventory_id?: string }).inventory_id;
    const sum = Number((row as { quantity_sum?: number }).quantity_sum ?? 0);
    if (id && sum > 0) mapa.set(id, sum);
  }
  return mapa;
}

export async function walidujDostepnoscAsortymentuWTerminie(
  supabase: SupabaseClient,
  hallId: string,
  startIso: string,
  endIso: string,
  requested: { inventoryId: string; quantity: number }[],
  excludeBookingId?: string | null,
): Promise<{ ok: true } | { ok: false; blad: string }> {
  if (requested.length === 0) return { ok: true };

  const ids = requested.map((r) => r.inventoryId);
  const { data: invRows, error: invErr } = await supabase
    .from("hall_inventory")
    .select("id, name, quantity, quantity_available")
    .eq("hall_id", hallId)
    .in("id", ids);

  if (invErr) {
    return { ok: false, blad: "Nie udało się zweryfikować dostępności asortymentu." };
  }

  const zajete = await pobierzZajetyAsortymentWPrzedziale(supabase, hallId, startIso, endIso, excludeBookingId);
  const mapa = new Map(
    (invRows ?? []).map((r) => [
      r.id as string,
      { name: r.name as string, max: Number(r.quantity_available ?? r.quantity ?? 0) },
    ]),
  );

  for (const req of requested) {
    const info = mapa.get(req.inventoryId);
    if (!info) {
      return { ok: false, blad: "Wybrana pozycja asortymentu nie istnieje już w tej sali." };
    }
    const juzZajete = zajete.get(req.inventoryId) ?? 0;
    const wolne = Math.max(0, info.max - juzZajete);
    if (req.quantity > wolne) {
      return {
        ok: false,
        blad: `${info.name}: w tym terminie dostępne ${wolne} szt. (z ${info.max}, ${juzZajete} już w innych rezerwacjach).`,
      };
    }
  }

  return { ok: true };
}
