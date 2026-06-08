import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";
import { obliczKompletnoscMapyWsi } from "@/lib/mapa/oblicz-kompletnosc-mapy-wsi";

const KAT_TRANSPORT = new Set(["przystanek", "stacja_kolejowa"]);

export type WiesNaMapie = {
  id: string;
  name: string;
  boundary_geojson: unknown | null;
  latitude?: number | null;
  longitude?: number | null;
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

/** Wsi z małą liczbą pinezek POI — do uzupełnienia z OSM. */
export function wybierzWsiZMalymPoi(
  wsie: WiesNaMapie[],
  punktyPoi: Pick<ZnacznikPoi, "villageId">[],
  limit: number,
  prog = 4,
): string[] {
  const licznik = new Map<string, number>();
  for (const p of punktyPoi) {
    licznik.set(p.villageId, (licznik.get(p.villageId) ?? 0) + 1);
  }
  return wsie
    .filter((w) => (licznik.get(w.id) ?? 0) < prog)
    .slice(0, limit)
    .map((w) => w.id);
}

/** Połącz listy wsi do sync (unikalne ID). */
export function polaczIdWsiDoUzupelnienia(...listy: string[][]): string[] {
  return Array.from(new Set(listy.flat()));
}

export function obliczStatystykiMapy(
  wsie: WiesNaMapie[],
  punktyPoi: Pick<ZnacznikPoi, "villageId" | "category">[],
): {
  lacznie: number;
  bezObrysu: number;
  bezTransportu: number;
  zMalymPoi: number;
  zPrzystankiem: number;
  zeStacja: number;
} {
  const maPrzystanek = new Set<string>();
  const maStacja = new Set<string>();
  const licznikPoi = new Map<string, number>();
  for (const p of punktyPoi) {
    const k = p.category.trim().toLowerCase();
    if (k === "przystanek") maPrzystanek.add(p.villageId);
    if (k === "stacja_kolejowa") maStacja.add(p.villageId);
    licznikPoi.set(p.villageId, (licznikPoi.get(p.villageId) ?? 0) + 1);
  }
  const bezObrysu = wsie.filter((w) => !w.boundary_geojson).length;
  const bezTransportu = wsie.filter((w) => !maPrzystanek.has(w.id) && !maStacja.has(w.id)).length;
  const zMalymPoi = wsie.filter((w) => (licznikPoi.get(w.id) ?? 0) < 4).length;
  return {
    lacznie: wsie.length,
    bezObrysu,
    bezTransportu,
    zMalymPoi,
    zPrzystankiem: maPrzystanek.size,
    zeStacja: maStacja.size,
  };
}

/** Średnia kompletność profilu mapy dla listy wsi (0–100). */
export function obliczSredniaKompletnoscMapy(
  wsie: WiesNaMapie[],
  punktyPoiLubIndeks: Pick<ZnacznikPoi, "villageId" | "category">[] | Map<string, string[]>,
): { srednia: number; ponizej50: number } {
  if (wsie.length === 0) return { srednia: 0, ponizej50: 0 };
  const kategoriePoWsi =
    punktyPoiLubIndeks instanceof Map
      ? punktyPoiLubIndeks
      : (() => {
          const mapa = new Map<string, string[]>();
          for (const p of punktyPoiLubIndeks) {
            const arr = mapa.get(p.villageId) ?? [];
            arr.push(p.category);
            mapa.set(p.villageId, arr);
          }
          return mapa;
        })();
  let suma = 0;
  let ponizej50 = 0;
  for (const w of wsie) {
    const k = obliczKompletnoscMapyWsi({
      boundary_geojson: w.boundary_geojson,
      latitude: w.latitude ?? null,
      longitude: w.longitude ?? null,
      kategoriePoi: kategoriePoWsi.get(w.id) ?? [],
    });
    suma += k.procent;
    if (k.procent < 50) ponizej50 += 1;
  }
  return { srednia: Math.round(suma / wsie.length), ponizej50 };
}
