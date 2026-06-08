import type { SupabaseClient } from "@supabase/supabase-js";

export type StatystykiGranicWsi = {
  wszystkieWsi: number;
  aktywneWsi: number;
  zObrysem: number;
  bezObrysu: number;
  zTerytBezObrysu: number;
  bezGpsBezObrysu: number;
  procentZObrysem: number;
  zrodla: Record<string, number>;
};

/** Szybkie statystyki pokrycia obrysów PRG w katalogu wsi. */
export async function pobierzStatystykiGranicWsi(
  supabase: SupabaseClient,
): Promise<StatystykiGranicWsi> {
  const [
    { count: wszystkieWsi },
    { count: aktywneWsi },
    { count: zObrysem },
    { count: bezObrysu },
    { count: zTerytBezObrysu },
    { count: bezGpsBezObrysu },
    { data: zrodlaRows },
  ] = await Promise.all([
    supabase.from("villages").select("*", { count: "exact", head: true }),
    supabase.from("villages").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("villages").select("*", { count: "exact", head: true }).not("boundary_geojson", "is", null),
    supabase.from("villages").select("*", { count: "exact", head: true }).is("boundary_geojson", null),
    supabase
      .from("villages")
      .select("*", { count: "exact", head: true })
      .is("boundary_geojson", null)
      .not("teryt_id", "is", null),
    supabase
      .from("villages")
      .select("*", { count: "exact", head: true })
      .is("boundary_geojson", null)
      .not("teryt_id", "is", null)
      .or("latitude.is.null,longitude.is.null"),
    supabase.from("villages").select("boundary_source").not("boundary_source", "is", null),
  ]);

  const zrodla: Record<string, number> = {};
  for (const row of zrodlaRows ?? []) {
    const key = String(row.boundary_source ?? "unknown");
    zrodla[key] = (zrodla[key] ?? 0) + 1;
  }

  const total = wszystkieWsi ?? 0;
  const zObrysemCount = zObrysem ?? 0;

  return {
    wszystkieWsi: total,
    aktywneWsi: aktywneWsi ?? 0,
    zObrysem: zObrysemCount,
    bezObrysu: bezObrysu ?? 0,
    zTerytBezObrysu: zTerytBezObrysu ?? 0,
    bezGpsBezObrysu: bezGpsBezObrysu ?? 0,
    procentZObrysem: total > 0 ? Math.round((100 * zObrysemCount) / total) : 0,
    zrodla,
  };
}
