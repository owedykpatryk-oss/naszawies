import type { SupabaseClient } from "@supabase/supabase-js";

export type RaportJakosciKatalogu = {
  wszystkie: number;
  aktywne: number;
  zGranica: number;
  zWspolrzednymi: number;
  zSoltysem: number;
  bezGranicy: number;
  bezWspolrzednych: number;
};

export async function pobierzJakoscKatalogu(
  supabase: SupabaseClient,
): Promise<RaportJakosciKatalogu | null> {
  const { count: wszystkie } = await supabase.from("villages").select("id", { count: "exact", head: true });
  const { count: aktywne } = await supabase
    .from("villages")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: zGranica } = await supabase
    .from("villages")
    .select("id", { count: "exact", head: true })
    .not("boundary_geojson", "is", null);

  const { count: zWspolrzednymi } = await supabase
    .from("villages")
    .select("id", { count: "exact", head: true })
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const { count: zSoltysem } = await supabase
    .from("villages")
    .select("id", { count: "exact", head: true })
    .not("soltys_user_id", "is", null);

  const w = wszystkie ?? 0;
  const zg = zGranica ?? 0;
  const zw = zWspolrzednymi ?? 0;

  return {
    wszystkie: w,
    aktywne: aktywne ?? 0,
    zGranica: zg,
    zWspolrzednymi: zw,
    zSoltysem: zSoltysem ?? 0,
    bezGranicy: Math.max(0, w - zg),
    bezWspolrzednych: Math.max(0, w - zw),
  };
}
