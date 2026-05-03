/**
 * Eksport warstwy GUS „R02_Granice obwodów spisowych” (GML / WFS) do GeoJSON w WGS84.
 *
 * To nie są granice wsi w sensie TERYT/SIMC — to obwody spisowe. Pole TERYT w danych
 * zazwyczaj wskazuje na jednostkę terytorialną (np. gminę), a jedna miejscowość w katalogu
 * `villages` ma własny `teryt_id` (SIMC). Dopasowanie do wsi: w QGIS, po scaleniu
 * wielokątów, ręcznie, albo gdy w waszym rejonie 1 obwód = 1 wieś.
 *
 * Użycie:
 *   node scripts/gml-obwody-spisowe-to-geojson.mjs ścieżka/do/pliku.gml
 *   node scripts/gml-obwody-spisowe-to-geojson.mjs plik.gml --out obwody.geojson
 *
 * Wymaga: `npm install` (proj4 w devDependencies).
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { XMLParser } from "fast-xml-parser";
import proj4 from "proj4";

const SRC = "EPSG:2180";
// ETRS89 / Poland CS2000 (1992) — wspólne z warstwami GUGiK
proj4.defs(
  SRC,
  "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);
const WGS = "EPSG:4326";

function toLonLatEpsg2180(x, y) {
  return proj4(SRC, WGS, [x, y]);
}

function coalescePosListText(raw) {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && "#text" in raw && raw["#text"] != null) {
    return String(raw["#text"]);
  }
  return String(raw);
}

function posListToRing2d(text) {
  const t = coalescePosListText(text).trim();
  if (!t) return [];
  const n = t.split(/\s+/).map(Number);
  const ring = [];
  for (let i = 0; i < n.length - 1; i += 2) {
    const [E, N] = [n[i], n[i + 1]];
    if (!Number.isFinite(E) || !Number.isFinite(N)) continue;
    const [lon, lat] = toLonLatEpsg2180(E, N);
    ring.push([lon, lat]);
  }
  if (ring.length >= 2) {
    const a = ring[0];
    const b = ring[ring.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) return ring;
    ring.push([a[0], a[1]]);
  }
  return ring;
}

function getPosListString(linearRing) {
  if (!linearRing || typeof linearRing === "string") return linearRing ?? "";
  return coalescePosListText(linearRing.posList ?? linearRing["#text"] ?? "");
}

function ringFromPolygonJson(poly) {
  if (!poly?.exterior) return null;
  const ext = poly.exterior.LinearRing ?? poly.exterior.linearRing;
  return posListToRing2d(getPosListString(ext));
}

function gmlToFeatureCollection(gml) {
  const p = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: false,
    trimValues: true,
    isArray: (n) => n === "member",
  });
  const d = p.parse(gml);
  const fc = d?.FeatureCollection;
  if (!fc) throw new Error("Brak elementu gml:FeatureCollection / wfs:FeatureCollection");

  let members = fc.member;
  if (!Array.isArray(members)) members = members == null ? [] : [members];

  const features = [];
  for (const m of members) {
    const o = m?.R02_Granice_obwodow_spisowych;
    if (!o) continue;

    const poly = o.msGeometry?.Polygon;
    if (!poly) continue;
    const exterior = ringFromPolygonJson(poly);
    if (!exterior || exterior.length < 4) continue;

    /** Kody numeryczne z GML — parser może zwrócić liczbę (utrata zer); odtwarzamy długość. */
    const padNum = (v, len) => {
      if (v == null || v === "") return null;
      const s = String(v).replace(/\D/g, "");
      if (!s) return String(v);
      return s.length >= len ? s : s.padStart(len, "0");
    };
    const asText = (v) => (v == null || v === "" ? null : String(v));
    const props = {
      WW: padNum(o.WW, 2),
      PP: padNum(o.PP, 2),
      GG: padNum(o.GG, 2),
      R: asText(o.R),
      OBWOD: padNum(o.OBWOD, 7),
      REJ: padNum(o.REJ, 6),
      OBW: asText(o.OBW),
      TERYT: padNum(o.TERYT, 7),
      SHAPE_LENG: o.SHAPE_LENG,
      SHAPE_AREA: o.SHAPE_AREA,
    };
    for (const k of Object.keys(props)) {
      if (props[k] === "" || props[k] == null) delete props[k];
    }

    features.push({
      type: "Feature",
      properties: props,
      geometry: { type: "Polygon", coordinates: [exterior] },
    });
  }

  return {
    type: "FeatureCollection",
    name: "obwody_spisowe",
    features,
  };
}

async function main() {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const projectRoot = resolve(here, "..");
  const args = process.argv.slice(2).filter((a) => a !== "--");
  let inPath;
  let outPath;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--out" && args[i + 1]) {
      outPath = resolve(projectRoot, args[i + 1]);
      i += 1;
    } else if (!inPath) inPath = resolve(args[i] ?? "");
  }
  if (!inPath) {
    console.error(
      "Użycie: node scripts/gml-obwody-spisowe-to-geojson.mjs <plik.gml> [--out wynik.geojson]",
    );
    process.exit(1);
  }
  const gml = await readFile(inPath, "utf8");
  const collection = gmlToFeatureCollection(gml);
  const outJson = JSON.stringify(collection, null, 2) + "\n";
  if (outPath) {
    await writeFile(outPath, outJson, "utf8");
    console.log(
      `Zapisano ${collection.features.length} obiektów → ${outPath} (${(outJson.length / 1e3).toFixed(1)} KB)`,
    );
  } else {
    process.stdout.write(outJson);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
  });
}

export { gmlToFeatureCollection };
