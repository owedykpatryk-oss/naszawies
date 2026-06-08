import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";
import { KATEGORIA_LATARNIA } from "@/lib/mapa/kategorie-poi";
import { KATEGORIA_INWESTYCJA } from "@/lib/mapa/inwestycje-poi";
import {
  KATEGORIE_POI_DROGA_NOCLEG,
  KATEGORIE_POI_RATUNEK_WODA,
  KATEGORIE_POI_USLUGI,
  nalezyDoGrupyPoi,
} from "@/lib/mapa/kategorie-poi-grupy";

export type StatystykiPoiMapy = {
  kategorie: string[];
  liczbaLatarn: number;
  liczbaInwestycji: number;
  liczbaWodyOsp: number;
  liczbaDroga: number;
  liczbaUslug: number;
  liczbaRatunekWoda: number;
};

/** Jedno przejście po liście POI zamiast wielu filter(). */
export function obliczStatystykiPoiNaMapie(
  punktyPoi: readonly Pick<ZnacznikPoi, "category">[],
): StatystykiPoiMapy {
  const kategorie = new Set<string>();
  let liczbaLatarn = 0;
  let liczbaInwestycji = 0;
  let liczbaWodyOsp = 0;
  let liczbaDroga = 0;
  let liczbaUslug = 0;
  let liczbaRatunekWoda = 0;

  for (const p of punktyPoi) {
    kategorie.add(p.category);
    const k = p.category.trim().toLowerCase();
    if (k === KATEGORIA_LATARNIA) liczbaLatarn++;
    else if (k === KATEGORIA_INWESTYCJA) liczbaInwestycji++;
    else if (k === "osp_punkt_czerpania_wody") liczbaWodyOsp++;
    else if (nalezyDoGrupyPoi(p.category, KATEGORIE_POI_DROGA_NOCLEG)) liczbaDroga++;
    else if (nalezyDoGrupyPoi(p.category, KATEGORIE_POI_USLUGI)) liczbaUslug++;
    else if (nalezyDoGrupyPoi(p.category, KATEGORIE_POI_RATUNEK_WODA)) liczbaRatunekWoda++;
  }

  return {
    kategorie: Array.from(kategorie).sort((a, b) => a.localeCompare(b, "pl")),
    liczbaLatarn,
    liczbaInwestycji,
    liczbaWodyOsp,
    liczbaDroga,
    liczbaUslug,
    liczbaRatunekWoda,
  };
}

/** Indeks kategorii POI per wieś — do kompletności i filtrów. */
export function indeksKategoriiPoiPoWsi(
  punktyPoi: readonly Pick<ZnacznikPoi, "villageId" | "category">[],
): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const p of punktyPoi) {
    const arr = mapa.get(p.villageId);
    if (arr) arr.push(p.category);
    else mapa.set(p.villageId, [p.category]);
  }
  return mapa;
}
