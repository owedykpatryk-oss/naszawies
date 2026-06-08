import { scalOdjazdyPkpPlanIRzeczywistosc } from "@/lib/transport/pkp-scal-odjazdy";

const DEFAULT_BASE_URL = "https://pdp-api.plk-sa.pl";

type AnyObj = Record<string, unknown>;

export type PkpStation = { id: string; name: string };
export type PkpDisruption = {
  id: string;
  message: string;
  typeCode: string | null;
  startStationId: string | null;
  endStationId: string | null;
};
export type PkpDeparture = {
  departureUid: string;
  whenIso: string;
  plannedWhenIso: string;
  realtimeWhenIso: string | null;
  trainLabel: string;
  destination: string | null;
  carrier: string | null;
  platform: string | null;
  delayMinutes: number | null;
  status: string | null;
  isCancelled: boolean;
  sourceUpdatedAtIso: string | null;
};

function baseUrl(): string {
  return process.env.PKP_PLK_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

function apiKey(): string | null {
  const k = process.env.PKP_PLK_API_KEY?.trim();
  return k && k.length > 0 ? k : null;
}

export function czyOperacjePkpWlaczone(): boolean {
  return String(process.env.TRANSPORT_PKP_USE_OPERATIONS ?? "1") !== "0";
}

export function linkRozkladPkpDlaStacji(nazwaStacji: string): string {
  return `https://rozklad.pkp.pl/pl/results?from=${encodeURIComponent(nazwaStacji.trim())}`;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(pathWithQuery: string): Promise<unknown> {
  const key = apiKey();
  if (!key) {
    throw new Error("Brak PKP_PLK_API_KEY.");
  }
  const res = await fetch(`${baseUrl()}${pathWithQuery}`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      "X-API-Key": key,
      Accept: "application/json",
      "User-Agent": "NaszawiesPl/1.0 (+https://naszawies.pl/)",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PKP API HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return (await res.json()) as unknown;
}

function toArray(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") {
    const o = input as AnyObj;
    for (const k of ["items", "data", "results", "stations", "schedules"]) {
      if (Array.isArray(o[k])) return o[k] as unknown[];
    }
  }
  return [];
}

function pickFirstString(o: AnyObj, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

function stationFromUnknown(x: unknown): PkpStation | null {
  if (!x || typeof x !== "object") return null;
  const o = x as AnyObj;
  const id = pickFirstString(o, ["id", "stationId", "station_id", "code", "value"]);
  const name = pickFirstString(o, ["name", "stationName", "station_name", "label", "displayName"]);
  if (!id || !name) return null;
  return { id, name };
}

function stacjeZeSlownika(json: unknown): PkpStation[] {
  const o = json as AnyObj;
  const items = toArray(o.items ?? o.data ?? o.stations ?? json);
  const out: PkpStation[] = [];
  for (const it of items) {
    const st = stationFromUnknown(it);
    if (st) out.push(st);
  }
  return out;
}

export async function wyszukajStacjePkpPoNazwie(phrase: string): Promise<PkpStation[]> {
  const q = phrase.trim();
  if (!q) return [];

  const candidates = new Map<string, PkpStation>();
  const tries = [
    `/api/v1/dictionaries/stations?search=${encodeURIComponent(q)}&page=1&pageSize=50`,
    `/api/v1/dictionaries/stations?name=${encodeURIComponent(q)}&page=1&pageSize=50`,
    `/api/v1/dictionaries/stations?query=${encodeURIComponent(q)}&page=1&pageSize=50`,
  ];

  for (const path of tries) {
    try {
      const json = await fetchJson(path);
      for (const st of stacjeZeSlownika(json)) {
        candidates.set(st.id, st);
      }
      if (candidates.size > 0) break;
    } catch {
      // Spróbuj kolejną strategię.
    }
  }

  const nQ = normalize(q);
  return Array.from(candidates.values())
    .filter((s) => normalize(s.name).includes(nQ))
    .sort((a, b) => {
      const an = normalize(a.name);
      const bn = normalize(b.name);
      const aStarts = an.startsWith(nQ) ? 0 : 1;
      const bStarts = bn.startsWith(nQ) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return an.localeCompare(bn, "pl");
    })
    .slice(0, 12);
}

function parseIsoCandidate(v: unknown): string | null {
  if (typeof v !== "string" || v.trim().length < 10) return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function parseNumberCandidate(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  if (typeof v === "string" && v.trim().length > 0) {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

function normalizeStatus(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function departureFromUnknown(x: unknown): PkpDeparture | null {
  if (!x || typeof x !== "object") return null;
  const o = x as AnyObj;
  const planned =
    parseIsoCandidate(o.plannedDeparture) ||
    parseIsoCandidate(o.departurePlanned) ||
    parseIsoCandidate(o.departureTime) ||
    parseIsoCandidate(o.scheduledDeparture);
  if (!planned) return null;

  const realtime =
    parseIsoCandidate(o.realtimeDeparture) ||
    parseIsoCandidate(o.departureRealtime) ||
    parseIsoCandidate(o.estimatedDeparture) ||
    parseIsoCandidate(o.actualDeparture);

  const trainLabel =
    pickFirstString(o, ["trainName", "trainNumber", "number", "name", "label"]) ?? "Pociąg";
  const destination = pickFirstString(o, ["destination", "destinationName", "to", "stationToName"]);
  const carrier = pickFirstString(o, ["carrier", "carrierCode", "operator"]);
  const platform = pickFirstString(o, ["platform", "platformNumber", "track", "peron"]);
  const status = normalizeStatus(o.status) || normalizeStatus(o.state);
  const explicitDelay =
    parseNumberCandidate(o.delayMinutes) ||
    parseNumberCandidate(o.delayMin) ||
    parseNumberCandidate(o.delay);
  const computedDelay =
    realtime != null
      ? Math.round((Date.parse(realtime) - Date.parse(planned)) / 60000)
      : null;
  const delayMinutes = explicitDelay ?? computedDelay;
  const isCancelledRaw =
    o.isCancelled === true ||
    o.cancelled === true ||
    (typeof status === "string" && /cancel|odwo/i.test(status));
  const sourceUpdatedAtIso =
    parseIsoCandidate(o.updatedAt) ||
    parseIsoCandidate(o.lastUpdate) ||
    parseIsoCandidate(o.sourceUpdatedAt);

  const departureUid = [
    trainLabel.trim().toLowerCase(),
    planned,
    (destination ?? "").trim().toLowerCase(),
  ].join("|");

  return {
    departureUid,
    whenIso: realtime ?? planned,
    plannedWhenIso: planned,
    realtimeWhenIso: realtime,
    trainLabel,
    destination,
    carrier,
    platform,
    delayMinutes,
    status,
    isCancelled: isCancelledRaw,
    sourceUpdatedAtIso,
  };
}

function operacjaStacjiNaOdjazd(
  train: AnyObj,
  stationId: string,
  stationDict: Record<string, string> | undefined,
  generatedAt: string | null,
): PkpDeparture | null {
  const sid = Number(stationId);
  if (!Number.isFinite(sid)) return null;

  const stations = toArray(train.stations ?? train.st);
  const stEntry = stations.find((s) => {
    const row = s as AnyObj;
    const id = row.stationId ?? row.sid;
    return Number(id) === sid;
  }) as AnyObj | undefined;
  if (!stEntry) return null;

  const planned =
    parseIsoCandidate(stEntry.plannedDeparture ?? stEntry.pd) ||
    parseIsoCandidate(stEntry.plannedDepartureTime);
  const actual =
    parseIsoCandidate(stEntry.actualDeparture ?? stEntry.ad) ||
    parseIsoCandidate(stEntry.actualDepartureTime);
  if (!planned && !actual) return null;

  const plannedIso = planned ?? actual!;
  const realtimeIso = actual ?? null;
  const delayExplicit =
    parseNumberCandidate(stEntry.departureDelayMinutes) ?? parseNumberCandidate(stEntry.dd);
  const computedDelay =
    realtimeIso != null
      ? Math.round((Date.parse(realtimeIso) - Date.parse(plannedIso)) / 60000)
      : null;
  const delayMinutes = delayExplicit ?? computedDelay;

  const lastSt = stations[stations.length - 1] as AnyObj | undefined;
  const lastId = lastSt ? String(lastSt.stationId ?? lastSt.sid ?? "") : "";
  const destination =
    lastId && stationDict?.[lastId]
      ? stationDict[lastId]
      : lastId && stationDict?.[String(Number(lastId))]
        ? stationDict[String(Number(lastId))]
        : null;

  const scheduleId = train.scheduleId ?? train.sid;
  const orderId = train.orderId ?? train.oid;
  const trainLabel =
    pickFirstString(train, ["nationalNumber", "trainNumber", "name", "label"]) ??
    (scheduleId != null && orderId != null ? `Pociąg ${scheduleId}/${orderId}` : "Pociąg");

  const isCancelled =
    stEntry.isCancelled === true ||
    stEntry.isCancelled === 1 ||
    train.trainStatus === "X" ||
    train.trainStatus === "Q" ||
    train.s === "X" ||
    train.s === "Q";

  const departureUid = [
    String(trainLabel).trim().toLowerCase(),
    plannedIso,
    (destination ?? "").trim().toLowerCase(),
  ].join("|");

  return {
    departureUid,
    whenIso: realtimeIso ?? plannedIso,
    plannedWhenIso: plannedIso,
    realtimeWhenIso: realtimeIso,
    trainLabel: String(trainLabel),
    destination,
    carrier: pickFirstString(train, ["carrierCode", "carrier"]),
    platform: pickFirstString(stEntry, ["platform", "departurePlatform", "track"]),
    delayMinutes,
    status: normalizeStatus(train.trainStatus ?? train.s),
    isCancelled,
    sourceUpdatedAtIso: generatedAt,
  };
}

async function pobierzOdjazdyPlanoweDlaStacjiPkp(
  stationId: string,
  hoursAhead: number,
): Promise<PkpDeparture[]> {
  const from = new Date();
  const to = new Date(from.getTime() + hoursAhead * 60 * 60 * 1000);
  const dateFrom = from.toISOString().slice(0, 10);
  const dateTo = to.toISOString().slice(0, 10);

  const json = await fetchJson(
    `/api/v1/schedules?dateFrom=${dateFrom}&dateTo=${dateTo}&stations=${encodeURIComponent(stationId)}&page=1&pageSize=500`,
  );
  return toArray(json)
    .map(departureFromUnknown)
    .filter(Boolean)
    .map((x) => x as PkpDeparture)
    .filter((d) => Date.parse(d.plannedWhenIso) >= Date.now() - 10 * 60 * 1000)
    .sort((a, b) => Date.parse(a.whenIso) - Date.parse(b.whenIso))
    .slice(0, 32);
}

export async function pobierzOdjazdyOperacyjneDlaStacjiPkp(
  stationId: string,
): Promise<PkpDeparture[]> {
  const json = await fetchJson(
    `/api/v1/operations?stations=${encodeURIComponent(stationId)}&withPlanned=true&page=1&pageSize=500`,
  );
  const o = json as AnyObj;
  const generatedAt = parseIsoCandidate(o.generatedAt ?? o.ts);
  const stationDict = (o.stations ?? o.st) as Record<string, string> | undefined;
  const trains = toArray(o.trains ?? o.tr);

  return trains
    .map((tr) => operacjaStacjiNaOdjazd(tr as AnyObj, stationId, stationDict, generatedAt))
    .filter(Boolean)
    .map((x) => x as PkpDeparture)
    .filter((d) => Date.parse(d.plannedWhenIso) >= Date.now() - 10 * 60 * 1000)
    .sort((a, b) => Date.parse(a.whenIso) - Date.parse(b.whenIso))
    .slice(0, 32);
}

export async function pobierzUtrudnieniaDlaStacjiPkp(
  stationIds: string[],
): Promise<PkpDisruption[]> {
  const ids = stationIds.filter(Boolean);
  if (ids.length === 0) return [];

  const json = await fetchJson(
    `/api/v1/disruptions?stations=${encodeURIComponent(ids.join(","))}&dictionaries=false&page=1&pageSize=100`,
  );
  const o = json as AnyObj;
  const lista = toArray(o.disruptions ?? o.ds);

  return lista
    .map((raw) => {
      const d = raw as AnyObj;
      const id = pickFirstString(d, ["disruptionId", "did", "id"]) ?? "";
      const message = pickFirstString(d, ["message", "msg", "text"]);
      if (!message) return null;
      const startId = d.startStationId ?? d.ssid;
      const endId = d.endStationId ?? d.esid;
      return {
        id: id || message.slice(0, 40),
        message: message.slice(0, 500),
        typeCode: pickFirstString(d, ["disruptionTypeCode", "dtc", "type"]),
        startStationId: startId != null ? String(startId) : null,
        endStationId: endId != null ? String(endId) : null,
      } satisfies PkpDisruption;
    })
    .filter(Boolean)
    .map((x) => x as PkpDisruption)
    .slice(0, 8);
}

/** Bezpośrednie połączenia planowe między dwoma stacjami (np. wieś → miasto powiatowe). */
export async function pobierzPolaczeniaMiedzyStacjamiPkp(
  fromStationId: string,
  toStationId: string,
  opts?: { hoursAhead?: number },
): Promise<PkpDeparture[]> {
  const hoursAhead = Math.max(1, Math.min(48, Number(opts?.hoursAhead ?? 36)));
  const from = new Date();
  const to = new Date(from.getTime() + hoursAhead * 60 * 60 * 1000);
  const dateFrom = from.toISOString().slice(0, 10);
  const dateTo = to.toISOString().slice(0, 10);

  const json = await fetchJson(
    `/api/v1/schedules?dateFrom=${dateFrom}&dateTo=${dateTo}&fromStations=${encodeURIComponent(fromStationId)}&toStations=${encodeURIComponent(toStationId)}&page=1&pageSize=120`,
  );
  return toArray(json)
    .map(departureFromUnknown)
    .filter(Boolean)
    .map((x) => x as PkpDeparture)
    .filter((d) => Date.parse(d.plannedWhenIso) >= Date.now() - 10 * 60 * 1000)
    .sort((a, b) => Date.parse(a.whenIso) - Date.parse(b.whenIso))
    .slice(0, 12);
}

export async function pobierzOdjazdyDlaStacjiPkp(
  stationId: string,
  opts?: { hoursAhead?: number; tylkoPlan?: boolean },
): Promise<PkpDeparture[]> {
  const hoursAhead = Math.max(1, Math.min(48, Number(opts?.hoursAhead ?? 24)));
  const planowane = await pobierzOdjazdyPlanoweDlaStacjiPkp(stationId, hoursAhead);
  if (opts?.tylkoPlan || !czyOperacjePkpWlaczone()) return planowane.slice(0, 24);

  try {
    const operacyjne = await pobierzOdjazdyOperacyjneDlaStacjiPkp(stationId);
    return scalOdjazdyPkpPlanIRzeczywistosc(planowane, operacyjne).slice(0, 24);
  } catch {
    return planowane.slice(0, 24);
  }
}
