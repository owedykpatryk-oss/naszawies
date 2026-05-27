import type { SupabaseClient } from "@supabase/supabase-js";

/** Usuwa przeterminowane wpisy cache (kolej i autobus). */
export async function czyscStaryCacheTransportu(
  supabase: SupabaseClient,
  villageIds?: string[],
): Promise<{ kolej: number; autobus: number }> {
  const granicaPrzeszlosci = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const granicaPrzyszlosci = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  let sumaKolej = 0;
  let sumaAutobus = 0;

  const tabele = [
    { tabela: "transport_departures_cache" as const, pole: "kolej" as const },
    { tabela: "bus_departures_cache" as const, pole: "autobus" as const },
  ];

  for (const { tabela, pole } of tabele) {
    for (const [filtr, wartosc] of [
      ["lt", granicaPrzeszlosci],
      ["gt", granicaPrzyszlosci],
    ] as const) {
      let q = supabase.from(tabela).delete({ count: "exact" });
      if (filtr === "lt") q = q.lt("planned_at", wartosc);
      else q = q.gt("planned_at", wartosc);
      if (villageIds?.length) q = q.in("village_id", villageIds);
      const { count } = await q;
      const n = count ?? 0;
      if (pole === "kolej") sumaKolej += n;
      else sumaAutobus += n;
    }
  }

  return { kolej: sumaKolej, autobus: sumaAutobus };
}
