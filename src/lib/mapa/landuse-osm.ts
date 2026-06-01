/** Typy zagospodarowania z OSM — kolory i etykiety na mapie. */
export const LANDUSE_OSM_WSPOLNE = [
  "forest",
  "farmland",
  "meadow",
  "residential",
  "industrial",
  "commercial",
  "retail",
  "orchard",
  "vineyard",
  "brownfield",
  "construction",
  "grass",
] as const;

export type LanduseOsm = (typeof LANDUSE_OSM_WSPOLNE)[number];

export const ETYKIETA_LANDUSE: Record<string, string> = {
  forest: "Las / zadrzewienie",
  farmland: "Grunty rolne",
  meadow: "Łąka",
  residential: "Zabudowa mieszkaniowa",
  industrial: "Strefa przemysłowa",
  commercial: "Handel / usługi",
  retail: "Handel detaliczny",
  orchard: "Sady",
  vineyard: "Winnica",
  brownfield: "Teren poprzemysłowy",
  construction: "Teren budowy",
  grass: "Trawnik / trawa",
};

export const KOLOR_LANDUSE: Record<string, { fill: string; stroke: string }> = {
  forest: { fill: "#15803d", stroke: "#14532d" },
  farmland: { fill: "#eab308", stroke: "#a16207" },
  meadow: { fill: "#84cc16", stroke: "#4d7c0f" },
  residential: { fill: "#f472b6", stroke: "#be185d" },
  industrial: { fill: "#64748b", stroke: "#334155" },
  commercial: { fill: "#a855f7", stroke: "#7e22ce" },
  retail: { fill: "#c084fc", stroke: "#9333ea" },
  orchard: { fill: "#f97316", stroke: "#c2410c" },
  vineyard: { fill: "#7c3aed", stroke: "#5b21b6" },
  brownfield: { fill: "#78716c", stroke: "#44403c" },
  construction: { fill: "#fb923c", stroke: "#ea580c" },
  grass: { fill: "#86efac", stroke: "#22c55e" },
};

export function etykietaLanduseOsm(kod: string): string {
  return ETYKIETA_LANDUSE[kod] ?? `Zagospodarowanie (${kod})`;
}

export function stylLanduseOsm(kod: string): { fillColor: string; color: string; fillOpacity: number } {
  const s = KOLOR_LANDUSE[kod] ?? { fill: "#94a3b8", stroke: "#64748b" };
  return { fillColor: s.fill, color: s.stroke, fillOpacity: 0.32 };
}
