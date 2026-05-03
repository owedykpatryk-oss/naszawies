const DEFAULT_BASE_URL = "https://pdp-api.plk-sa.pl";

type AnyObj = Record<string, unknown>;

export type PkpStation = { id: string; name: string };
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

export async function wyszukajStacjePkpPoNazwie(phrase: string): Promise<PkpStation[]> {
  const q = phrase.trim();
  if (!q) return [];

  const candidates = new Map<string, PkpStation>();
  const tries = [
    `/api/v1/dictionaries/stations?name=${encodeURIComponent(q)}&page=1&pageSize=50`,
    `/api/v1/dictionaries/stations?query=${encodeURIComponent(q)}&page=1&pageSize=50`,
    `/api/v1/dictionaries/stations?page=1&pageSize=5000`,
  ];

  for (const path of tries) {
    try {
      const json = await fetchJson(path);
      for (const it of toArray(json)) {
        const st = stationFromUnknown(it);
        if (st) candidates.set(st.id, st);
      }
      if (candidates.size > 0 && path !== tries[2]) break;
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
    .slice(0, 8);
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

export async function pobierzOdjazdyDlaStacjiPkp(
  stationId: string,
  opts?: { hoursAhead?: number },
): Promise<PkpDeparture[]> {
  const from = new Date();
  const hoursAhead = Math.max(1, Math.min(48, Number(opts?.hoursAhead ?? 24)));
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
    .slice(0, 24);
}
