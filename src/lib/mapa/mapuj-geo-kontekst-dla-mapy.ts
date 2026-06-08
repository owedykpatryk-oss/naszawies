import type { ZnacznikGeoKontekst } from "@/components/mapa/mapa-wsi-leaflet";

type WierszGeoKontekst = {
  id: string;
  village_id: string;
  dataset: string;
  layer_name: string;
  feature_category: string | null;
  feature_name: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

function etykietaWarstwy(layerName: string, dataset: string): string {
  const l = layerName.includes(":") ? layerName.split(":").pop()! : layerName;
  if (dataset === "PRNG") {
    if (l.startsWith("O1_")) return "PRNG — urzędowe";
    if (l.startsWith("O2_")) return "PRNG — zestandaryzowane";
    if (l.startsWith("O3_")) return "PRNG — pozostałe";
    return "PRNG";
  }
  if (l.includes("strazy_pozarnej") || l.startsWith("K07") || l.startsWith("K06")) {
    return "PSP / OSP";
  }
  if (l.includes("obrony_cywilnej") || l.startsWith("K11") || l.startsWith("K12") || l.startsWith("K13")) {
    return "Obrona cywilna (obszar)";
  }
  if (l.includes("policji") || l.startsWith("K01") || l.startsWith("K02") || l.startsWith("K04") || l.startsWith("K05")) {
    return "Policja";
  }
  if (l.includes("Prokuratura") || l.startsWith("P0")) return "Prokuratura";
  if (l.includes("Nadlesnictwo") || l.startsWith("U06")) return "Nadleśnictwo";
  if (l.includes("skarbowy") || l.startsWith("U02") || l.startsWith("U03") || l.startsWith("U04") || l.startsWith("U05")) {
    return "Urząd skarbowy";
  }
  if (l.includes("zlewni") || l.startsWith("U08")) return "PGW — zlewnia";
  if (l.includes("gospodarki_wodnej") || l.startsWith("U09")) return "RZGW";
  if (l.includes("lasow") || l.startsWith("U07")) return "RDLP";
  if (l.includes("Archiwum") || l.startsWith("U01")) return "Archiwum";
  if (l.includes("Sad") || l.startsWith("S0")) return "Sąd";
  return "Instytucja PRG";
}

export function mapujGeoKontekstDlaMapy(
  wiersze: WierszGeoKontekst[] | null,
  wiesPoId: Map<string, { name: string; sciezka: string }>,
  limit = 600,
): ZnacznikGeoKontekst[] {
  if (!wiersze?.length) return [];
  const out: ZnacznikGeoKontekst[] = [];
  for (const r of wiersze) {
    if (out.length >= limit) break;
    const w = wiesPoId.get(r.village_id);
    if (!w) continue;
    const lat = Number(r.latitude);
    const lon = Number(r.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const name = (r.feature_name?.trim() || r.feature_category?.trim() || "Obiekt geograficzny").slice(0, 120);
    out.push({
      id: r.id,
      villageId: r.village_id,
      villageName: w.name,
      sciezkaWsi: w.sciezka,
      dataset: r.dataset,
      name,
      rodzaj: r.feature_category,
      lat,
      lon,
      layerLabel: etykietaWarstwy(r.layer_name, r.dataset),
    });
  }
  return out;
}
