/**
 * Uproszczony import GTFS z publicznych plików CSV (stops.txt, stop_times.txt).
 * Ustaw TRANSPORT_GTFS_STOPS_URL i TRANSPORT_GTFS_STOP_TIMES_URL (HTTPS).
 */

export type GtfsStop = {
  stopId: string;
  name: string;
  lat: number;
  lon: number;
};

export type GtfsOdjazd = {
  departureUid: string;
  stopId: string;
  stopName: string;
  lineLabel: string;
  destination: string | null;
  plannedWhenIso: string;
};

function enabled(): boolean {
  return !!(process.env.TRANSPORT_GTFS_STOPS_URL?.trim() && process.env.TRANSPORT_GTFS_STOP_TIMES_URL?.trim());
}

export function gtfsCsvSkonfigurowany(): boolean {
  return enabled();
}

function odlegloscM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Parsuje linię CSV z cudzysłowami (uproszczone). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

let cacheStops: GtfsStop[] | null = null;
let cacheStopTimesRaw: string[] | null = null;
let cacheLoadedAt = 0;

async function zaladujGtfs(): Promise<void> {
  if (cacheStops && Date.now() - cacheLoadedAt < 6 * 60 * 60 * 1000) return;

  const stopsUrl = process.env.TRANSPORT_GTFS_STOPS_URL!.trim();
  const timesUrl = process.env.TRANSPORT_GTFS_STOP_TIMES_URL!.trim();

  const [stopsRes, timesRes] = await Promise.all([
    fetch(stopsUrl, { signal: AbortSignal.timeout(60_000) }),
    fetch(timesUrl, { signal: AbortSignal.timeout(120_000) }),
  ]);

  if (!stopsRes.ok) throw new Error(`GTFS stops HTTP ${stopsRes.status}`);
  if (!timesRes.ok) throw new Error(`GTFS stop_times HTTP ${timesRes.status}`);

  const stopsText = await stopsRes.text();
  const timesText = await timesRes.text();

  const lines = stopsText.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] ?? "");
  const idx = {
    id: header.indexOf("stop_id"),
    name: header.indexOf("stop_name"),
    lat: header.indexOf("stop_lat"),
    lon: header.indexOf("stop_lon"),
  };
  if (idx.id < 0 || idx.lat < 0 || idx.lon < 0) {
    throw new Error("GTFS stops.txt: brak wymaganych kolumn.");
  }

  const stops: GtfsStop[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    const lat = Number.parseFloat(cols[idx.lat] ?? "");
    const lon = Number.parseFloat(cols[idx.lon] ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    stops.push({
      stopId: cols[idx.id] ?? `s${i}`,
      name: idx.name >= 0 ? (cols[idx.name] ?? "Przystanek") : "Przystanek",
      lat,
      lon,
    });
  }

  cacheStops = stops;
  cacheStopTimesRaw = timesText.split(/\r?\n/).filter(Boolean);
  cacheLoadedAt = Date.now();
}

export async function pobierzOdjazdyGtfsDlaPunktu(args: {
  lat: number;
  lon: number;
  radiusM?: number;
  hoursAhead?: number;
}): Promise<GtfsOdjazd[]> {
  if (!enabled()) return [];
  await zaladujGtfs();
  if (!cacheStops?.length || !cacheStopTimesRaw?.length) return [];

  const radiusM = args.radiusM ?? 8000;
  const maxTime = Date.now() + (args.hoursAhead ?? 24) * 60 * 60 * 1000;

  const nearby = cacheStops.filter((s) => odlegloscM(args.lat, args.lon, s.lat, s.lon) <= radiusM);
  const stopIds = new Set(nearby.map((s) => s.stopId));
  const stopById = new Map(nearby.map((s) => [s.stopId, s]));

  const header = parseCsvLine(cacheStopTimesRaw[0] ?? "");
  const idxTrip = header.indexOf("trip_id");
  const idxStop = header.indexOf("stop_id");
  const idxArrival = header.indexOf("arrival_time");
  if (idxStop < 0 || idxArrival < 0) return [];

  const dzis = new Date();
  const baza = new Date(dzis.getFullYear(), dzis.getMonth(), dzis.getDate()).getTime();

  const out: GtfsOdjazd[] = [];

  for (let i = 1; i < cacheStopTimesRaw.length; i++) {
    const cols = parseCsvLine(cacheStopTimesRaw[i]!);
    const stopId = cols[idxStop];
    if (!stopId || !stopIds.has(stopId)) continue;
    const timeStr = cols[idxArrival];
    if (!timeStr) continue;
    const parts = timeStr.split(":");
    if (parts.length < 2) continue;
    const h = Number.parseInt(parts[0] ?? "0", 10);
    const m = Number.parseInt(parts[1] ?? "0", 10);
    const sec = parts[2] ? Number.parseInt(parts[2], 10) : 0;
    let when = baza + ((h % 24) * 3600 + m * 60 + sec) * 1000;
    if (h >= 24) when += Math.floor(h / 24) * 24 * 3600 * 1000;
    if (when < Date.now() - 5 * 60 * 1000 || when > maxTime) continue;

    const stop = stopById.get(stopId)!;
    const tripId = idxTrip >= 0 ? cols[idxTrip] : "trip";
    out.push({
      departureUid: `${stopId}-${tripId}-${timeStr}`,
      stopId,
      stopName: stop.name,
      lineLabel: `Linia ${String(tripId).slice(0, 12)}`,
      destination: null,
      plannedWhenIso: new Date(when).toISOString(),
    });
  }

  return out.sort((a, b) => Date.parse(a.plannedWhenIso) - Date.parse(b.plannedWhenIso)).slice(0, 40);
}
