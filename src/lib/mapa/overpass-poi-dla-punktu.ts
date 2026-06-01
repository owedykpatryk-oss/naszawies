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
  /** Dla `osp_punkt_czerpania_wody` — typ źródła z tagów OSM. */
  ospWaterSourceType?: "hydrant" | "staw" | "zbiornik" | "rzeka" | "inne";
  /** Dla `inwestycja` — status z tagów OSM (construction / proposed). */
  investmentStatus?: "planowana" | "w_budowie";
};

export type MapowaniePoiZOsm = {
  category: string;
  ospWaterSourceType?: SugerowanyPoiZOsm["ospWaterSourceType"];
  investmentStatus?: "planowana" | "w_budowie";
};

/** Pomniki, rezerwaty i czysta przyroda — nie importujemy automatycznie na mapę wsi. */
export function czyPominacTagiOsm(tags: Record<string, string>): boolean {
  const historic = tags.historic?.trim();
  if (
    historic === "memorial" ||
    historic === "monument" ||
    historic === "memorial_plaque" ||
    historic === "wayside_shrine" ||
    historic === "wayside_cross"
  ) {
    return true;
  }
  if (tags.man_made === "cross" || tags.tourism === "artwork") return true;
  if (tags.leisure === "nature_reserve" || tags.boundary === "protected_area") return true;
  if (tags.natural === "peak" || tags.natural === "tree" || tags.natural === "wood" || tags.natural === "scrub") {
    return true;
  }
  if (tags.tourism === "viewpoint" && !tags.emergency) return true;
  return false;
}

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
export function mapujPoiZOsmTagow(tags: Record<string, string>): MapowaniePoiZOsm | null {
  if (czyPominacTagiOsm(tags)) return null;

  const a = tags.amenity?.trim();
  const lu = tags.landuse?.trim();
  const s = tags.shop?.trim();
  const h = tags.highway?.trim();
  const pt = tags.public_transport?.trim();
  const bus = tags.bus?.trim();
  const rail = tags.railway?.trim();
  const mm = tags.man_made?.trim();
  const content = tags.content?.trim();
  const coop = tags.cooperative?.trim();
  const emergency = tags.emergency?.trim();
  const natural = tags.natural?.trim();
  const water = tags.water?.trim();

  if (a === "fire_hydrant" || emergency === "fire_hydrant") {
    return { category: "osp_punkt_czerpania_wody", ospWaterSourceType: "hydrant" };
  }
  if (emergency === "water_tank" || (mm === "storage_tank" && content === "water")) {
    return { category: "osp_punkt_czerpania_wody", ospWaterSourceType: "zbiornik" };
  }
  if (emergency === "water_source" || (mm === "water_well" && emergency)) {
    return { category: "osp_punkt_czerpania_wody", ospWaterSourceType: "inne" };
  }
  if (natural === "water" && (water === "pond" || water === "reservoir")) {
    return { category: "osp_punkt_czerpania_wody", ospWaterSourceType: water === "pond" ? "staw" : "zbiornik" };
  }
  if (lu === "reservoir" || water === "reservoir") {
    return { category: "osp_punkt_czerpania_wody", ospWaterSourceType: "zbiornik" };
  }
  if (tags.waterway && emergency === "water_source") {
    return { category: "osp_punkt_czerpania_wody", ospWaterSourceType: "rzeka" };
  }

  if (a === "school") return { category: "szkola" };
  if (a === "kindergarten") return { category: "przedszkole" };
  if (a === "place_of_worship") return { category: "kosciol" };
  if (a === "community_centre") return { category: "swietlica" };
  if (a === "fire_station") return { category: "osp" };
  if (a === "library") return { category: "biblioteka" };
  if (a === "grave_yard") return { category: "cmentarz" };
  if (lu === "cemetery") return { category: "cmentarz" };
  if (a === "townhall") return { category: "urzad" };
  if (tags.office === "government") return { category: "urzad" };
  if (a === "pharmacy") return { category: "apteka" };
  if (a === "post_office") return { category: "poczta" };
  if (a === "fuel") return { category: "stacja_paliw" };
  if (a === "clinic" || a === "doctors" || a === "hospital") return { category: "przychodnia" };
  const leisure = tags.leisure?.trim();
  if (leisure === "pitch" || leisure === "sports_centre" || leisure === "stadium" || leisure === "track") {
    return { category: "boisko" };
  }
  if (a === "bus_station") return { category: "przystanek" };
  if (h === "bus_stop") return { category: "przystanek" };
  if (h === "street_lamp" || mm === "street_lamp") return { category: "latarnia" };
  if ((pt === "platform" || pt === "stop_position") && (bus === "yes" || bus === "designated")) {
    return { category: "przystanek" };
  }
  if (rail === "station" || rail === "halt") return { category: "stacja_kolejowa" };
  if (s === "convenience" || s === "supermarket" || s === "general" || s === "mall" || s === "department_store") {
    return { category: "sklep" };
  }
  if (s === "agrarian" || s === "farm") return { category: "sklep_rolniczy" };
  if (mm === "silo" && (content === "grain" || content === "maize")) return { category: "skup_zboz" };
  if (coop === "agricultural") return { category: "spoldzielnia_rolna" };
  if (tags.produce === "yes" || tags["produce:crops"] === "yes") return { category: "sprzedaz_z_gospodarstwa" };

  const building = tags.building?.trim();
  const construction = tags.construction?.trim();
  if (building === "construction" || lu === "construction" || construction) {
    return { category: "inwestycja", investmentStatus: "w_budowie" };
  }
  if (tags["proposed:building"] || tags["planned:building"] || tags["proposed:landuse"]) {
    return { category: "inwestycja", investmentStatus: "planowana" };
  }

  return null;
}

export function kategoriaPoiZOsmTagow(tags: Record<string, string>): string | null {
  return mapujPoiZOsmTagow(tags)?.category ?? null;
}

function etykietaDomyslna(kategoria: string, ospWaterSourceType?: SugerowanyPoiZOsm["ospWaterSourceType"]): string {
  if (kategoria === "osp_punkt_czerpania_wody") {
    switch (ospWaterSourceType) {
      case "hydrant":
        return "Hydrant (OpenStreetMap)";
      case "staw":
        return "Staw — pobór wody (OpenStreetMap)";
      case "zbiornik":
        return "Zbiornik wody (OpenStreetMap)";
      case "rzeka":
        return "Ciek / rzeka — pobór wody (OpenStreetMap)";
      default:
        return "Punkt czerpania wody (OpenStreetMap)";
    }
  }
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
    case "apteka":
      return "Apteka (OpenStreetMap, brak nazwy)";
    case "poczta":
      return "Poczta (OpenStreetMap, brak nazwy)";
    case "stacja_paliw":
      return "Stacja paliw (OpenStreetMap, brak nazwy)";
    case "przychodnia":
      return "Przychodnia / placówka zdrowia (OpenStreetMap, brak nazwy)";
    case "przystanek":
      return "Przystanek autobusowy (OpenStreetMap, brak nazwy)";
    case "stacja_kolejowa":
      return "Stacja kolejowa (OpenStreetMap, brak nazwy)";
    case "cmentarz":
      return "Cmentarz (OpenStreetMap, brak nazwy)";
    case "boisko":
      return "Boisko / obiekt sportowy (OpenStreetMap, brak nazwy)";
    case "urzad":
      return "Urząd / instytucja (OpenStreetMap, brak nazwy)";
    case "skup_zboz":
      return "Skup zboża (OpenStreetMap, brak nazwy)";
    case "sklep_rolniczy":
      return "Sklep rolniczy (OpenStreetMap, brak nazwy)";
    case "sprzedaz_z_gospodarstwa":
      return "Sprzedaż z gospodarstwa (OpenStreetMap)";
    case "spoldzielnia_rolna":
      return "Spółdzielnia rolnicza (OpenStreetMap, brak nazwy)";
    case "latarnia":
      return "Latarnia uliczna (OpenStreetMap, brak nazwy)";
    case "inwestycja":
      return "Budowa / inwestycja (OpenStreetMap, brak nazwy)";
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
  nwr["landuse"="cemetery"](around:${r},${lat},${lon});
  nwr["amenity"="townhall"](around:${r},${lat},${lon});
  nwr["office"="government"](around:${r},${lat},${lon});
  nwr["amenity"="pharmacy"](around:${r},${lat},${lon});
  nwr["amenity"="post_office"](around:${r},${lat},${lon});
  nwr["amenity"="fuel"](around:${r},${lat},${lon});
  nwr["amenity"="clinic"](around:${r},${lat},${lon});
  nwr["amenity"="doctors"](around:${r},${lat},${lon});
  nwr["amenity"="hospital"](around:${r},${lat},${lon});
  nwr["leisure"="pitch"](around:${r},${lat},${lon});
  nwr["leisure"="sports_centre"](around:${r},${lat},${lon});
  nwr["leisure"="stadium"](around:${r},${lat},${lon});
  nwr["leisure"="track"](around:${r},${lat},${lon});
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
  nwr["shop"="agrarian"](around:${r},${lat},${lon});
  nwr["shop"="farm"](around:${r},${lat},${lon});
  nwr["man_made"="silo"]["content"="grain"](around:${r},${lat},${lon});
  nwr["man_made"="silo"]["content"="maize"](around:${r},${lat},${lon});
  nwr["cooperative"="agricultural"](around:${r},${lat},${lon});
  nwr["amenity"="fire_hydrant"](around:${r},${lat},${lon});
  nwr["emergency"="fire_hydrant"](around:${r},${lat},${lon});
  nwr["emergency"="water_tank"](around:${r},${lat},${lon});
  nwr["emergency"="water_source"](around:${r},${lat},${lon});
  nwr["man_made"="storage_tank"]["content"="water"](around:${r},${lat},${lon});
  nwr["natural"="water"]["water"="pond"](around:${r},${lat},${lon});
  nwr["natural"="water"]["water"="reservoir"](around:${r},${lat},${lon});
  nwr["landuse"="reservoir"](around:${r},${lat},${lon});
  node["highway"="street_lamp"](around:${r},${lat},${lon});
  node["man_made"="street_lamp"](around:${r},${lat},${lon});
  nwr["building"="construction"](around:${r},${lat},${lon});
  nwr["landuse"="construction"](around:${r},${lat},${lon});
  nwr["construction"](around:${r},${lat},${lon});
  nwr["proposed:building"](around:${r},${lat},${lon});
  nwr["planned:building"](around:${r},${lat},${lon});
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
    const mapa = mapujPoiZOsmTagow(tags);
    if (!mapa) continue;
    const xy = wspolrzedne(el);
    if (!xy) continue;
    const osmType = el.type as SugerowanyPoiZOsm["osmType"];
    surowe.push({
      category: mapa.category,
      name: nazwaZTagow(tags, etykietaDomyslna(mapa.category, mapa.ospWaterSourceType)),
      lat: xy.lat,
      lon: xy.lon,
      osmType,
      osmId: el.id,
      ospWaterSourceType: mapa.ospWaterSourceType,
      investmentStatus: mapa.investmentStatus,
    });
  }

  const punkty = deduplikujWewnetrznie(surowe, 45);
  return { ok: true, punkty };
}

/** Szybsze zapytanie — tylko cmentarze (amenity=grave_yard + landuse=cemetery). */
function zbudujZapytanieOverpassCmentarze(lat: number, lon: number, promienM: number): string {
  const r = Math.round(promienM);
  return `[out:json][timeout:35];
(
  nwr["amenity"="grave_yard"](around:${r},${lat},${lon});
  nwr["landuse"="cemetery"](around:${r},${lat},${lon});
);
out center tags;
`;
}

export async function pobierzCmentarzeZOsmWokolPunktu(
  lat: number,
  lon: number,
  promienM = 4000,
): Promise<{ ok: true; punkty: SugerowanyPoiZOsm[] } | { ok: false; blad: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, blad: "Nieprawidłowe współrzędne punktu odniesienia." };
  }
  const r = Math.min(8000, Math.max(800, Math.round(promienM)));
  const body = zbudujZapytanieOverpassCmentarze(lat, lon, r);

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
      signal: AbortSignal.timeout(40_000),
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

  const surowe: SugerowanyPoiZOsm[] = [];
  for (const el of json.elements ?? []) {
    if (el.type !== "node" && el.type !== "way" && el.type !== "relation") continue;
    const tags = el.tags ?? {};
    const kat = kategoriaPoiZOsmTagow(tags);
    if (kat !== "cmentarz") continue;
    const xy = wspolrzedne(el);
    if (!xy) continue;
    surowe.push({
      category: "cmentarz",
      name: nazwaZTagow(tags, etykietaDomyslna("cmentarz")),
      lat: xy.lat,
      lon: xy.lon,
      osmType: el.type as SugerowanyPoiZOsm["osmType"],
      osmId: el.id,
    });
  }

  const punkty = deduplikujWewnetrznie(surowe, 80);
  return { ok: true, punkty };
}

/** Szybsze zapytanie — tylko obiekty kultu (amenity=place_of_worship). */
function zbudujZapytanieOverpassKosciol(lat: number, lon: number, promienM: number): string {
  const r = Math.round(promienM);
  return `[out:json][timeout:35];
(
  nwr["amenity"="place_of_worship"](around:${r},${lat},${lon});
);
out center tags;
`;
}

export async function pobierzKosciolZOsmWokolPunktu(
  lat: number,
  lon: number,
  promienM = 3500,
): Promise<{ ok: true; punkty: SugerowanyPoiZOsm[] } | { ok: false; blad: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, blad: "Nieprawidłowe współrzędne punktu odniesienia." };
  }
  const r = Math.min(8000, Math.max(600, Math.round(promienM)));
  const body = zbudujZapytanieOverpassKosciol(lat, lon, r);

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
      signal: AbortSignal.timeout(40_000),
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

  const surowe: SugerowanyPoiZOsm[] = [];
  for (const el of json.elements ?? []) {
    if (el.type !== "node" && el.type !== "way" && el.type !== "relation") continue;
    const tags = el.tags ?? {};
    const kat = kategoriaPoiZOsmTagow(tags);
    if (kat !== "kosciol") continue;
    const xy = wspolrzedne(el);
    if (!xy) continue;
    surowe.push({
      category: "kosciol",
      name: nazwaZTagow(tags, etykietaDomyslna("kosciol")),
      lat: xy.lat,
      lon: xy.lon,
      osmType: el.type as SugerowanyPoiZOsm["osmType"],
      osmId: el.id,
    });
  }

  const punkty = deduplikujWewnetrznie(surowe, 70);
  return { ok: true, punkty };
}

/** Szybsze zapytanie — remiza / straż pożarna (amenity=fire_station). */
function zbudujZapytanieOverpassOsp(lat: number, lon: number, promienM: number): string {
  const r = Math.round(promienM);
  return `[out:json][timeout:35];
(
  nwr["amenity"="fire_station"](around:${r},${lat},${lon});
);
out center tags;
`;
}

export async function pobierzOspZOsmWokolPunktu(
  lat: number,
  lon: number,
  promienM = 4000,
): Promise<{ ok: true; punkty: SugerowanyPoiZOsm[] } | { ok: false; blad: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, blad: "Nieprawidłowe współrzędne punktu odniesienia." };
  }
  const r = Math.min(8000, Math.max(800, Math.round(promienM)));
  const body = zbudujZapytanieOverpassOsp(lat, lon, r);

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
      signal: AbortSignal.timeout(40_000),
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

  const surowe: SugerowanyPoiZOsm[] = [];
  for (const el of json.elements ?? []) {
    if (el.type !== "node" && el.type !== "way" && el.type !== "relation") continue;
    const tags = el.tags ?? {};
    const kat = kategoriaPoiZOsmTagow(tags);
    if (kat !== "osp") continue;
    const xy = wspolrzedne(el);
    if (!xy) continue;
    surowe.push({
      category: "osp",
      name: nazwaZTagow(tags, etykietaDomyslna("osp")),
      lat: xy.lat,
      lon: xy.lon,
      osmType: el.type as SugerowanyPoiZOsm["osmType"],
      osmId: el.id,
    });
  }

  const punkty = deduplikujWewnetrznie(surowe, 90);
  return { ok: true, punkty };
}
