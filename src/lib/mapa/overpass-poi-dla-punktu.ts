/**
 * Pobieranie punktów (szkoła, kościół, sklep…) z OpenStreetMap przez publiczny Overpass API.
 * Zgodnie z polityką OSM: identyfikowalny User-Agent, oszczędne zapytania, wyniki do weryfikacji na miejscu.
 */

const USER_AGENT = "NaszawiesPl/1.0 (+https://naszawies.pl/)";

export type SugerowanyPoiZOsm = {
  category: string;
  name: string;
  lat: number;
  lon: number;
  osmType: "node" | "way" | "relation";
  osmId: number;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function wspolrzedne(el: OverpassElement): { lat: number; lon: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lon: el.lon };
  }
  const c = el.center;
  if (c && typeof c.lat === "number" && typeof c.lon === "number") {
    return { lat: c.lat, lon: c.lon };
  }
  return null;
}

function nazwaZTagow(tags: Record<string, string>, domyslna: string): string {
  const n =
    tags["name:pl"]?.trim() ||
    tags.name?.trim() ||
    tags["official_name:pl"]?.trim() ||
    tags.official_name?.trim();
  if (n) return n.length > 200 ? `${n.slice(0, 197)}…` : n;
  return domyslna;
}

/** Mapuje tagi OSM na klucze `pois.category` z `kategorie-poi.ts`. */
export function kategoriaPoiZOsmTagow(tags: Record<string, string>): string | null {
  const a = tags.amenity?.trim();
  const s = tags.shop?.trim();
  const h = tags.highway?.trim();
  const pt = tags.public_transport?.trim();
  const bus = tags.bus?.trim();
  const rail = tags.railway?.trim();
  if (a === "school") return "szkola";
  if (a === "kindergarten") return "przedszkole";
  if (a === "place_of_worship") return "kosciol";
  if (a === "community_centre") return "swietlica";
  if (a === "fire_station") return "osp";
  if (a === "library") return "biblioteka";
  if (a === "grave_yard") return "cmentarz";
  if (a === "bus_station") return "przystanek";
  if (h === "bus_stop") return "przystanek";
  if ((pt === "platform" || pt === "stop_position") && (bus === "yes" || bus === "designated")) return "przystanek";
  if (rail === "station" || rail === "halt") return "stacja_kolejowa";
  if (s === "convenience" || s === "supermarket" || s === "general" || s === "mall" || s === "department_store") {
    return "sklep";
  }
  return null;
}

function etykietaDomyslna(kategoria: string): string {
  switch (kategoria) {
    case "szkola":
      return "Szkoła (OpenStreetMap, brak nazwy)";
    case "przedszkole":
      return "Przedszkole (OpenStreetMap, brak nazwy)";
    case "kosciol":
      return "Obiekt kultu (OpenStreetMap, brak nazwy)";
    case "swietlica":
      return "Świetlica / dom kultury (OpenStreetMap, brak nazwy)";
    case "osp":
      return "Straż pożarna (OpenStreetMap, brak nazwy)";
    case "biblioteka":
      return "Biblioteka (OpenStreetMap, brak nazwy)";
    case "sklep":
      return "Sklep (OpenStreetMap, brak nazwy)";
    case "przystanek":
      return "Przystanek autobusowy (OpenStreetMap, brak nazwy)";
    case "stacja_kolejowa":
      return "Stacja kolejowa (OpenStreetMap, brak nazwy)";
    case "cmentarz":
      return "Cmentarz (OpenStreetMap, brak nazwy)";
    default:
      return "Miejsce (OpenStreetMap)";
  }
}

function odlegloscMetry(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Usuwa nakładające się wyniki (np. kilka punktów tej samej placówki). */
function deduplikujWewnetrznie(punkty: SugerowanyPoiZOsm[], minMetry: number): SugerowanyPoiZOsm[] {
  const out: SugerowanyPoiZOsm[] = [];
  for (const p of punkty) {
    const kolizja = out.some(
      (o) => o.category === p.category && odlegloscMetry(o.lat, o.lon, p.lat, p.lon) < minMetry,
    );
    if (kolizja) continue;
    out.push(p);
  }
  return out;
}

function zbudujZapytanieOverpass(lat: number, lon: number, promienM: number): string {
  const r = Math.round(promienM);
  return `[out:json][timeout:50];
(
  nwr["amenity"="school"](around:${r},${lat},${lon});
  nwr["amenity"="kindergarten"](around:${r},${lat},${lon});
  nwr["amenity"="place_of_worship"](around:${r},${lat},${lon});
  nwr["amenity"="community_centre"](around:${r},${lat},${lon});
  nwr["amenity"="fire_station"](around:${r},${lat},${lon});
  nwr["amenity"="library"](around:${r},${lat},${lon});
  nwr["amenity"="grave_yard"](around:${r},${lat},${lon});
  nwr["amenity"="bus_station"](around:${r},${lat},${lon});
  nwr["highway"="bus_stop"](around:${r},${lat},${lon});
  nwr["public_transport"="platform"]["bus"="yes"](around:${r},${lat},${lon});
  nwr["public_transport"="stop_position"]["bus"="yes"](around:${r},${lat},${lon});
  nwr["railway"="station"](around:${r},${lat},${lon});
  nwr["railway"="halt"](around:${r},${lat},${lon});
  nwr["shop"="convenience"](around:${r},${lat},${lon});
  nwr["shop"="supermarket"](around:${r},${lat},${lon});
  nwr["shop"="general"](around:${r},${lat},${lon});
  nwr["shop"="mall"](around:${r},${lat},${lon});
  nwr["shop"="department_store"](around:${r},${lat},${lon});
);
out center tags;
`;
}

export async function pobierzPoiZOsmWokolPunktu(
  lat: number,
  lon: number,
  promienM: number,
): Promise<{ ok: true; punkty: SugerowanyPoiZOsm[] } | { ok: false; blad: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, blad: "Nieprawidłowe współrzędne punktu odniesienia." };
  }
  const r = Math.min(8000, Math.max(400, Math.round(promienM)));
  const body = zbudujZapytanieOverpass(lat, lon, r);

  let res: Response;
  try {
    res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "User-Agent": USER_AGENT,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, blad: `Nie udało się połączyć z OpenStreetMap (Overpass): ${msg}` };
  }

  if (!res.ok) {
    return { ok: false, blad: `Overpass zwrócił błąd HTTP ${res.status}. Spróbuj za kilka minut.` };
  }

  let json: { elements?: OverpassElement[] };
  try {
    json = (await res.json()) as { elements?: OverpassElement[] };
  } catch {
    return { ok: false, blad: "Niepoprawna odpowiedź z serwera Overpass." };
  }

  const elements = json.elements ?? [];
  const surowe: SugerowanyPoiZOsm[] = [];

  for (const el of elements) {
    if (el.type !== "node" && el.type !== "way" && el.type !== "relation") continue;
    const tags = el.tags ?? {};
    const kat = kategoriaPoiZOsmTagow(tags);
    if (!kat) continue;
    const xy = wspolrzedne(el);
    if (!xy) continue;
    const osmType = el.type as SugerowanyPoiZOsm["osmType"];
    surowe.push({
      category: kat,
      name: nazwaZTagow(tags, etykietaDomyslna(kat)),
      lat: xy.lat,
      lon: xy.lon,
      osmType,
      osmId: el.id,
    });
  }

  const punkty = deduplikujWewnetrznie(surowe, 55);
  return { ok: true, punkty };
}
