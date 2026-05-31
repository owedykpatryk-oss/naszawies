import type { OdjazdRecznyWyswietlany } from "@/lib/transport/rozklad-przystanku-reczny";

export type OdjazdAutobusApi = {
  czas: string;
  linia: string;
  cel: string | null;
  opis?: string | null;
  przyjazd?: string | null;
  przez?: string | null;
  zrodlo?: "soltys" | "cache";
  peron?: string | null;
  anulowany?: boolean;
};

const fmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });

type CacheRow = {
  line_label: string;
  destination: string | null;
  planned_at: string;
  stop_name: string | null;
};

export function reczneDoApiOdjazdow(reczne: OdjazdRecznyWyswietlany[]): OdjazdAutobusApi[] {
  return reczne.map((r) => ({
    czas: r.czas,
    linia: r.linia,
    cel: r.cel,
    opis: r.opis,
    przyjazd: r.przyjazd,
    przez: r.przez,
    zrodlo: "soltys" as const,
  }));
}

export function cacheDoApiOdjazdow(rows: CacheRow[]): OdjazdAutobusApi[] {
  return rows.map((r) => ({
    czas: fmt.format(new Date(r.planned_at)),
    linia: r.line_label,
    cel: r.destination,
    opis: r.stop_name,
    zrodlo: "cache" as const,
  }));
}

/** Ręczne pierwsze, potem cache (bez duplikatów tej samej godziny+kierunku). */
export function scalOdjazdyAutobusApi(reczne: OdjazdAutobusApi[], cache: OdjazdAutobusApi[], limit = 8): OdjazdAutobusApi[] {
  const klucze = new Set(reczne.map((r) => `${r.czas}|${r.cel ?? ""}`));
  const res = [...reczne];
  for (const c of cache) {
    if (res.length >= limit) break;
    const k = `${c.czas}|${c.cel ?? ""}`;
    if (klucze.has(k)) continue;
    klucze.add(k);
    res.push(c);
  }
  return res.slice(0, limit);
}
