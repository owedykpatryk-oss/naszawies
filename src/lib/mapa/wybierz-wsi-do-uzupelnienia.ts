import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";

const KAT_TRANSPORT = new Set(["przystanek", "stacja_kolejowa"]);

export type WiesNaMapie = {
  id: string;
  name: string;
  boundary_geojson: unknown | null;
};

/** Wsi bez obrysu PRG — do sync granic. */
export function wybierzWsiBezObrysu(wsie: WiesNaMapie[], limit: number): string[] {
  return wsie
    .filter((w) => !w.boundary_geojson)
    .slice(0, limit)
    .map((w) => w.id);
}

/** Wsi bez przystanku ani stacji na mapie — do sync OSM + transport. */
export function wybierzWsiBezTransportuNaMapie(
  wsie: WiesNaMapie[],
  punktyPoi: Pick<ZnacznikPoi, "villageId" | "category">[],
  limit: number,
): string[] {
  const maTransport = new Set<string>();
  for (const p of punktyPoi) {
    if (KAT_TRANSPORT.has(p.category.trim().toLowerCase())) {
      maTransport.add(p.villageId);
    }
  }
  return wsie
    .filter((w) => !maTransport.has(w.id))
    .slice(0, limit)
    .map((w) => w.id);
}

export function obliczStatystykiMapy(
  wsie: WiesNaMapie[],
  punktyPoi: Pick<ZnacznikPoi, "villageId" | "category">[],
): {
  lacznie: number;
  bezObrysu: number;
  bezTransportu: number;
  zPrzystankiem: number;
  zeStacja: number;
} {
  const maPrzystanek = new Set<string>();
  const maStacja = new Set<string>();
  for (const p of punktyPoi) {
    const k = p.category.trim().toLowerCase();
    if (k === "przystanek") maPrzystanek.add(p.villageId);
    if (k === "stacja_kolejowa") maStacja.add(p.villageId);
  }
  const bezObrysu = wsie.filter((w) => !w.boundary_geojson).length;
  const bezTransportu = wsie.filter((w) => !maPrzystanek.has(w.id) && !maStacja.has(w.id)).length;
  return {
    lacznie: wsie.length,
    bezObrysu,
    bezTransportu,
    zPrzystankiem: maPrzystanek.size,
    zeStacja: maStacja.size,
  };
}
