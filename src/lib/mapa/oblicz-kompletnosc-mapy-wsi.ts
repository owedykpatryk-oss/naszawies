import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import { KATEGORIE_POI_BAZOWE } from "@/lib/mapa/kategorie-poi-bazowe";
import { wiesMaObrys } from "@/lib/mapa/wies-ma-obrys";

export type KompletnoscMapyWsi = {
  procent: number;
  brakujace: { klucz: string; etykieta: string }[];
  posiadaneKategorie: number;
  lacznieKategorii: number;
  maObrys: boolean;
  maGps: boolean;
  liczbaPoi: number;
  doWeryfikacji: number;
  oczekujacePropozycje: number;
};

export function obliczKompletnoscMapyWsi(args: {
  boundary_geojson: unknown | null;
  has_boundary?: boolean;
  latitude: number | null;
  longitude: number | null;
  kategoriePoi: string[];
  doWeryfikacji?: number;
  oczekujacePropozycje?: number;
}): KompletnoscMapyWsi {
  const maGps =
    args.latitude != null &&
    args.longitude != null &&
    Number.isFinite(args.latitude) &&
    Number.isFinite(args.longitude);
  const maObrys = wiesMaObrys(args);

  const set = new Set(args.kategoriePoi.map((k) => k.trim().toLowerCase()));
  const brakujace = KATEGORIE_POI_BAZOWE.filter((k) => !set.has(k)).map((k) => ({
    klucz: k,
    etykieta: etykietaKategoriiPoi(k),
  }));
  const posiadaneKategorie = KATEGORIE_POI_BAZOWE.length - brakujace.length;
  const lacznieKategorii = KATEGORIE_POI_BAZOWE.length;

  let procent = Math.round((posiadaneKategorie / lacznieKategorii) * 70);
  if (maGps) procent += 15;
  if (maObrys) procent += 15;
  procent = Math.min(100, Math.max(0, procent));

  return {
    procent,
    brakujace,
    posiadaneKategorie,
    lacznieKategorii,
    maObrys,
    maGps,
    liczbaPoi: args.kategoriePoi.length,
    doWeryfikacji: args.doWeryfikacji ?? 0,
    oczekujacePropozycje: args.oczekujacePropozycje ?? 0,
  };
}
