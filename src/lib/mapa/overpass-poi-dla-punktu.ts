/**
 * Pobieranie punktów (szkoła, kościół, sklep…) z OpenStreetMap przez publiczny Overpass API.
 * Zgodnie z polityką OSM: identyfikowalny User-Agent, oszczędne zapytania, wyniki do weryfikacji na miejscu.
 */

const USER_AGENT = "NaszawiesPl/1.0 (+https://naszawies.pl/)";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

async function sleepMs(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchOverpass(body: string, maxProb = 4): Promise<Response> {
  let lastStatus = 0;
  for (let proba = 0; proba < maxProb; proba += 1) {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "User-Agent": USER_AGENT,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(62_000),
    });
    if (res.ok) return res;
    lastStatus = res.status;
    if (proba < maxProb - 1 && (res.status === 429 || res.status === 504 || res.status === 502)) {
      await sleepMs(4000 * (proba + 1));
      continue;
    }
    return res;
  }
  return new Response(null, { status: lastStatus || 503 });
}

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
  const tourism = tags.tourism?.trim();

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

  if (emergency === "defibrillator" || a === "defibrillator") {
    return { category: "defibrylator" };
  }

  if (a === "school") return { category: "szkola" };
  if (a === "kindergarten") return { category: "przedszkole" };
  if (a === "place_of_worship" || tags.building === "chapel") return { category: "kosciol" };
  if (a === "community_centre" || a === "social_centre" || a === "events_venue") {
    return { category: "swietlica" };
  }
  if (a === "fire_station") return { category: "osp" };
  if (a === "library" || a === "public_bookcase") return { category: "biblioteka" };
  if (a === "grave_yard") return { category: "cmentarz" };
  if (lu === "cemetery") return { category: "cmentarz" };
  if (a === "townhall" || a === "police") return { category: "urzad" };
  if (tags.office === "government" || tags.office === "administrative") return { category: "urzad" };
  if (a === "pharmacy") return { category: "apteka" };
  if (s === "chemist" || s === "cosmetics" || s === "beauty") return { category: "drogeria" };
  if (a === "post_office" || a === "post_depot") return { category: "poczta" };
  if (a === "parcel_locker") return { category: "paczkomat" };
  if (a === "fuel") return { category: "stacja_paliw" };
  if (a === "charging_station") return { category: "ladowarka_ev" };
  if (a === "veterinary") return { category: "weterynarz" };
  if (a === "car_repair" || tags.craft === "car_repair" || tags.craft === "bicycle_repair") {
    return { category: "warsztat" };
  }
  if (s === "bicycle" && tags.service === "repair") return { category: "warsztat" };
  if (s === "bakery" || tags.craft === "bakery" || s === "pastry") return { category: "piekarnia" };
  if (a === "bank") return { category: "bank" };
  if (a === "toilets") return { category: "toaleta_publiczna" };
  if (a === "marketplace") return { category: "targowisko" };
  if (h === "rest_area" || h === "services") return { category: "miejsce_odpoczynku" };
  if (
    tourism === "motel" ||
    tourism === "guest_house" ||
    tourism === "hotel" ||
    tourism === "chalet" ||
    tourism === "hostel" ||
    tourism === "apartment"
  ) {
    return { category: "zajazd" };
  }
  if (a === "restaurant" || a === "cafe" || a === "pub" || a === "fast_food" || a === "bar") {
    return { category: "gastronomia" };
  }
  if (a === "atm") return { category: "bankomat" };
  if (a === "drinking_water") {
    return { category: "osp_punkt_czerpania_wody", ospWaterSourceType: "inne" };
  }
  if (a === "clinic" || a === "doctors" || a === "hospital" || a === "dentist") {
    return { category: "przychodnia" };
  }
  if (tags.healthcare === "centre" || tags.healthcare === "clinic") {
    return { category: "przychodnia" };
  }
  const leisure = tags.leisure?.trim();
  if (leisure === "playground") return { category: "plac_zabaw" };
  if (leisure === "fitness_station" || leisure === "outdoor_gym") {
    return { category: "silownia_zewnetrzna" };
  }
  if (leisure === "pitch" || leisure === "sports_centre" || leisure === "stadium" || leisure === "track") {
    return { category: "boisko" };
  }
  if (a === "bus_station") return { category: "przystanek" };
  if (h === "bus_stop") return { category: "przystanek" };
  if (h === "platform" && (bus === "yes" || bus === "designated" || pt === "platform")) {
    return { category: "przystanek" };
  }
  if (h === "street_lamp" || mm === "street_lamp") return { category: "latarnia" };
  if (pt === "platform" || pt === "stop_position") {
    const trolejbus = tags.trolleybus?.trim();
    const tram = tags.tram?.trim();
    const train = tags.train?.trim();
    if (bus === "yes" || bus === "designated" || trolejbus === "yes" || tram === "yes") {
      return { category: "przystanek" };
    }
    if (train === "yes" || rail === "platform") return null;
    if (h === "platform" || h === "bus_stop") return { category: "przystanek" };
  }
  if (rail === "tram_stop") return { category: "przystanek" };
  if (rail === "station" || rail === "halt") return { category: "stacja_kolejowa" };
  if (tourism === "picnic_site") return { category: "miejsce_odpoczynku" };
  if (tourism === "camp_site" || tourism === "caravan_site") return { category: "camping" };
  if (a === "parking") {
    if (bus === "yes" || tags.park_ride === "yes") return { category: "miejsce_odpoczynku" };
    return { category: "parking_publiczny" };
  }
  if (
    s === "convenience" ||
    s === "supermarket" ||
    s === "general" ||
    s === "mall" ||
    s === "department_store" ||
    s === "butcher" ||
    s === "greengrocer" ||
    s === "dairy" ||
    s === "alcohol" ||
    s === "newsagent" ||
    s === "variety_store" ||
    s === "hardware" ||
    s === "kiosk" ||
    s === "mobile_phone" ||
    s === "beverages" ||
    s === "seafood" ||
    s === "frozen_food"
  ) {
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
    case "miejsce_odpoczynku":
      return "Miejsce odpoczynku (OpenStreetMap, brak nazwy)";
    case "zajazd":
      return "Zajazd / nocleg (OpenStreetMap, brak nazwy)";
    case "gastronomia":
      return "Gastronomia (OpenStreetMap, brak nazwy)";
    case "plac_zabaw":
      return "Plac zabaw (OpenStreetMap, brak nazwy)";
    case "bankomat":
      return "Bankomat (OpenStreetMap, brak nazwy)";
    case "paczkomat":
      return "Paczkomat (OpenStreetMap, brak nazwy)";
    case "ladowarka_ev":
      return "Ładowarka EV (OpenStreetMap, brak nazwy)";
    case "weterynarz":
      return "Weterynarz (OpenStreetMap, brak nazwy)";
    case "warsztat":
      return "Warsztat (OpenStreetMap, brak nazwy)";
    case "piekarnia":
      return "Piekarnia (OpenStreetMap, brak nazwy)";
    case "bank":
      return "Bank (OpenStreetMap, brak nazwy)";
    case "parking_publiczny":
      return "Parking publiczny (OpenStreetMap, brak nazwy)";
    case "toaleta_publiczna":
      return "Toaleta publiczna (OpenStreetMap, brak nazwy)";
    case "camping":
      return "Kemping / pole namiotowe (OpenStreetMap, brak nazwy)";
    case "defibrylator":
      return "Defibrylator AED (OpenStreetMap, brak nazwy)";
    case "drogeria":
      return "Drogeria (OpenStreetMap, brak nazwy)";
    case "silownia_zewnetrzna":
      return "Siłownia zewnętrzna (OpenStreetMap, brak nazwy)";
    case "targowisko":
      return "Targ / marketplace (OpenStreetMap, brak nazwy)";
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

function promienDedupWewnetrznego(kategoria: string, domyslny = 45): number {
  if (kategoria === "przystanek") return 28;
  if (kategoria === "latarnia" || kategoria === "defibrylator") return 12;
  if (kategoria === "osp_punkt_czerpania_wody") return 35;
  if (kategoria === "miejsce_odpoczynku" || kategoria === "zajazd") return 55;
  if (kategoria === "parking_publiczny") return 70;
  if (kategoria === "paczkomat" || kategoria === "bankomat") return 40;
  return domyslny;
}

/** Usuwa nakładające się wyniki (np. kilka punktów tej samej placówki). */
function deduplikujWewnetrznie(punkty: SugerowanyPoiZOsm[], domyslnyPromien = 45): SugerowanyPoiZOsm[] {
  const out: SugerowanyPoiZOsm[] = [];
  for (const p of punkty) {
    const minMetry = promienDedupWewnetrznego(p.category, domyslnyPromien);
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
  return `[out:json][timeout:58];
(
  nwr["amenity"="school"](around:${r},${lat},${lon});
  nwr["amenity"="kindergarten"](around:${r},${lat},${lon});
  nwr["amenity"="place_of_worship"](around:${r},${lat},${lon});
  nwr["amenity"="community_centre"](around:${r},${lat},${lon});
  nwr["amenity"="social_centre"](around:${r},${lat},${lon});
  nwr["amenity"="events_venue"](around:${r},${lat},${lon});
  nwr["amenity"="fire_station"](around:${r},${lat},${lon});
  nwr["amenity"="library"](around:${r},${lat},${lon});
  nwr["amenity"="public_bookcase"](around:${r},${lat},${lon});
  nwr["amenity"="grave_yard"](around:${r},${lat},${lon});
  nwr["landuse"="cemetery"](around:${r},${lat},${lon});
  nwr["amenity"="townhall"](around:${r},${lat},${lon});
  nwr["amenity"="police"](around:${r},${lat},${lon});
  nwr["office"="government"](around:${r},${lat},${lon});
  nwr["office"="administrative"](around:${r},${lat},${lon});
  nwr["amenity"="pharmacy"](around:${r},${lat},${lon});
  nwr["amenity"="dentist"](around:${r},${lat},${lon});
  nwr["amenity"="post_office"](around:${r},${lat},${lon});
  nwr["amenity"="post_depot"](around:${r},${lat},${lon});
  nwr["amenity"="parcel_locker"](around:${r},${lat},${lon});
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
  nwr["highway"="platform"](around:${r},${lat},${lon});
  nwr["public_transport"="platform"](around:${r},${lat},${lon});
  nwr["public_transport"="stop_position"](around:${r},${lat},${lon});
  nwr["public_transport"="platform"]["bus"="yes"](around:${r},${lat},${lon});
  nwr["public_transport"="stop_position"]["bus"="yes"](around:${r},${lat},${lon});
  nwr["railway"="tram_stop"](around:${r},${lat},${lon});
  nwr["railway"="station"](around:${r},${lat},${lon});
  nwr["railway"="halt"](around:${r},${lat},${lon});
  nwr["shop"="convenience"](around:${r},${lat},${lon});
  nwr["shop"="supermarket"](around:${r},${lat},${lon});
  nwr["shop"="general"](around:${r},${lat},${lon});
  nwr["shop"="mall"](around:${r},${lat},${lon});
  nwr["shop"="department_store"](around:${r},${lat},${lon});
  nwr["shop"~"^(butcher|greengrocer|dairy|alcohol|newsagent|variety_store|hardware|kiosk|mobile_phone|beverages|seafood|frozen_food)$"](around:${r},${lat},${lon});
  nwr["shop"="chemist"](around:${r},${lat},${lon});
  nwr["shop"="cosmetics"](around:${r},${lat},${lon});
  nwr["shop"="bakery"](around:${r},${lat},${lon});
  nwr["shop"="pastry"](around:${r},${lat},${lon});
  nwr["shop"="car_repair"](around:${r},${lat},${lon});
  nwr["craft"="car_repair"](around:${r},${lat},${lon});
  nwr["craft"="bicycle_repair"](around:${r},${lat},${lon});
  nwr["craft"="bakery"](around:${r},${lat},${lon});
  nwr["shop"="agrarian"](around:${r},${lat},${lon});
  nwr["shop"="farm"](around:${r},${lat},${lon});
  nwr["man_made"="silo"]["content"="grain"](around:${r},${lat},${lon});
  nwr["man_made"="silo"]["content"="maize"](around:${r},${lat},${lon});
  nwr["cooperative"="agricultural"](around:${r},${lat},${lon});
  nwr["produce"="yes"](around:${r},${lat},${lon});
  nwr["produce:crops"="yes"](around:${r},${lat},${lon});
  nwr["amenity"="fire_hydrant"](around:${r},${lat},${lon});
  nwr["emergency"="fire_hydrant"](around:${r},${lat},${lon});
  nwr["emergency"="water_tank"](around:${r},${lat},${lon});
  nwr["emergency"="water_source"](around:${r},${lat},${lon});
  nwr["emergency"="defibrillator"](around:${r},${lat},${lon});
  nwr["amenity"="defibrillator"](around:${r},${lat},${lon});
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
  nwr["highway"="rest_area"](around:${r},${lat},${lon});
  nwr["highway"="services"](around:${r},${lat},${lon});
  nwr["tourism"="picnic_site"](around:${r},${lat},${lon});
  nwr["tourism"="motel"](around:${r},${lat},${lon});
  nwr["tourism"="guest_house"](around:${r},${lat},${lon});
  nwr["tourism"="hotel"](around:${r},${lat},${lon});
  nwr["tourism"="chalet"](around:${r},${lat},${lon});
  nwr["tourism"="hostel"](around:${r},${lat},${lon});
  nwr["tourism"="apartment"](around:${r},${lat},${lon});
  nwr["tourism"="camp_site"](around:${r},${lat},${lon});
  nwr["tourism"="caravan_site"](around:${r},${lat},${lon});
  nwr["amenity"="parking"](around:${r},${lat},${lon});
  nwr["amenity"="charging_station"](around:${r},${lat},${lon});
  nwr["amenity"="veterinary"](around:${r},${lat},${lon});
  nwr["amenity"="bank"](around:${r},${lat},${lon});
  nwr["amenity"="toilets"](around:${r},${lat},${lon});
  nwr["amenity"="marketplace"](around:${r},${lat},${lon});
  nwr["building"="chapel"](around:${r},${lat},${lon});
  nwr["healthcare"="centre"](around:${r},${lat},${lon});
  nwr["healthcare"="clinic"](around:${r},${lat},${lon});
  nwr["amenity"="restaurant"](around:${r},${lat},${lon});
  nwr["amenity"="cafe"](around:${r},${lat},${lon});
  nwr["amenity"="pub"](around:${r},${lat},${lon});
  nwr["amenity"="fast_food"](around:${r},${lat},${lon});
  nwr["amenity"="bar"](around:${r},${lat},${lon});
  nwr["leisure"="playground"](around:${r},${lat},${lon});
  nwr["leisure"="fitness_station"](around:${r},${lat},${lon});
  nwr["leisure"="outdoor_gym"](around:${r},${lat},${lon});
  nwr["amenity"="atm"](around:${r},${lat},${lon});
  nwr["amenity"="drinking_water"](around:${r},${lat},${lon});
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
    res = await fetchOverpass(body);
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

  const punkty = deduplikujWewnetrznie(surowe);
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
    res = await fetchOverpass(body);
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
    res = await fetchOverpass(body);
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
    res = await fetchOverpass(body);
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

/** Stacje i przystanki kolejowe w promieniu — do mapowania PKP → pinezka na mapie. */
function zbudujZapytanieOverpassStacjeKolejowe(lat: number, lon: number, promienM: number): string {
  const r = Math.round(promienM);
  return `[out:json][timeout:35];
(
  nwr["railway"="station"](around:${r},${lat},${lon});
  nwr["railway"="halt"](around:${r},${lat},${lon});
);
out center tags;
`;
}

export async function pobierzStacjeKolejoweZOsmWokolPunktu(
  lat: number,
  lon: number,
  promienM = 12_000,
): Promise<{ ok: true; punkty: SugerowanyPoiZOsm[] } | { ok: false; blad: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, blad: "Nieprawidłowe współrzędne punktu odniesienia." };
  }
  const r = Math.min(18_000, Math.max(1500, Math.round(promienM)));
  const body = zbudujZapytanieOverpassStacjeKolejowe(lat, lon, r);

  let res: Response;
  try {
    res = await fetchOverpass(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, blad: `Nie udało się połączyć z OpenStreetMap (Overpass): ${msg}` };
  }

  if (!res.ok) {
    return { ok: false, blad: `Overpass zwrócił błąd HTTP ${res.status}.` };
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
    if (kat !== "stacja_kolejowa") continue;
    const xy = wspolrzedne(el);
    if (!xy) continue;
    surowe.push({
      category: "stacja_kolejowa",
      name: nazwaZTagow(tags, etykietaDomyslna("stacja_kolejowa")),
      lat: xy.lat,
      lon: xy.lon,
      osmType: el.type as SugerowanyPoiZOsm["osmType"],
      osmId: el.id,
    });
  }

  const punkty = deduplikujWewnetrznie(surowe, 120);
  return { ok: true, punkty };
}
