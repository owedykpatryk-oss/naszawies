import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";

/** Publiczny punkt orientacyjny — obszar łowiecki (bez dokładnej ambony). */
export const KATEGORIA_TEREN_LOWIECKI = "teren_lowiecki";
export const KATEGORIA_OBSZAR_LOWOWY = "obszar_lowowy";
/** Tylko dla członków wsi: dokładna lokalizacja; dla pozostałych — strefa ~500 m. */
export const KATEGORIA_AMBONA = "ambona";
export const KATEGORIA_POSTERUNEK = "posterunek_lowiecki";

export const KATEGORIE_POI_LOWIECKIE_MAPA = [
  KATEGORIA_TEREN_LOWIECKI,
  KATEGORIA_OBSZAR_LOWOWY,
  KATEGORIA_AMBONA,
  KATEGORIA_POSTERUNEK,
  "siedziba_kola",
  "zebrania_kola",
] as const;

const KATEGORIE_WRAZLIWE = new Set([KATEGORIA_AMBONA, KATEGORIA_POSTERUNEK]);

const KATEGORIE_Z_KOLKIEM_STREFY = new Set([
  KATEGORIA_TEREN_LOWIECKI,
  KATEGORIA_OBSZAR_LOWOWY,
]);

/** Siatka ~500 m — stabilna strefa orientacyjna (nie dokładne miejsce ambony). */
const SIATKA_STREFY = 0.0045;

export type PrecyzjaPoiMapy = "dokladna" | "strefa";

export function czyKategoriaPoiLowiecka(kategoria: string): boolean {
  const k = kategoria.trim().toLowerCase();
  return (KATEGORIE_POI_LOWIECKIE_MAPA as readonly string[]).includes(k);
}

export function czyKategoriaWrazliwaLowiecko(kategoria: string): boolean {
  return KATEGORIE_WRAZLIWE.has(kategoria.trim().toLowerCase());
}

/** Zaokrągla współrzędne do strefy orientacyjnej (~500 m), deterministycznie po id POI. */
export function wspolrzedneStrefyOrientacyjnej(
  lat: number,
  lon: number,
  id: string,
): { lat: number; lon: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const jLat = (((h & 0xff) - 128) / 256) * SIATKA_STREFY;
  const jLon = ((((h >> 8) & 0xff) - 128) / 256) * SIATKA_STREFY;
  return {
    lat: Math.round(lat / SIATKA_STREFY) * SIATKA_STREFY + jLat,
    lon: Math.round(lon / SIATKA_STREFY) * SIATKA_STREFY + jLon,
  };
}

export function promienStrefyPoi(kategoria: string): number | null {
  const k = kategoria.trim().toLowerCase();
  if (k === KATEGORIA_TEREN_LOWIECKI) return 900;
  if (k === KATEGORIA_OBSZAR_LOWOWY) return 650;
  if (KATEGORIE_WRAZLIWE.has(k)) return 480;
  return null;
}

/**
 * Dostosowuje POI łowieckie do uprawnień użytkownika na mapie katalogu.
 * Członek wsi (aktywna rola) widzi dokładne ambony/posterunki; pozostali — strefę orientacyjną.
 */
export function przygotujPoiLowieckieNaMape(
  punkty: ZnacznikPoi[],
  wioskiCzlonkow: Set<string>,
): ZnacznikPoi[] {
  return punkty.map((p) => {
    const kat = p.category.trim().toLowerCase();
    if (!czyKategoriaPoiLowiecka(kat)) return p;

    const czlonk = wioskiCzlonkow.has(p.villageId);
    const wrazliwy = czyKategoriaWrazliwaLowiecko(kat);
    const radius = promienStrefyPoi(kat);

    if (wrazliwy && czlonk) {
      return { ...p, mapPrecision: "dokladna" as PrecyzjaPoiMapy, strefaRadiusM: undefined };
    }

    if (wrazliwy) {
      const strefa = wspolrzedneStrefyOrientacyjnej(p.lat, p.lon, p.id);
      return {
        ...p,
        lat: strefa.lat,
        lon: strefa.lon,
        mapPrecision: "strefa" as PrecyzjaPoiMapy,
        strefaRadiusM: radius ?? 480,
      };
    }

    return {
      ...p,
      mapPrecision: "strefa" as PrecyzjaPoiMapy,
      strefaRadiusM: radius ?? undefined,
    };
  });
}

export function tekstPrecyzjiPoiMapy(p: ZnacznikPoi): string | null {
  const kat = p.category.trim().toLowerCase();
  if (p.mapPrecision === "strefa" && czyKategoriaWrazliwaLowiecko(kat)) {
    return "Lokalizacja orientacyjna (strefa ~500 m). Dokładne miejsce widzą członkowie tej wsi w serwisie.";
  }
  if (KATEGORIE_Z_KOLKIEM_STREFY.has(kat)) {
    return "Obszar łowiecki orientacyjnie — nie zastępuje oznakowania w terenie ani przepisów.";
  }
  return null;
}
