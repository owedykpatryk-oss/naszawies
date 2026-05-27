/**
 * Opcjonalna integracja e-podróżnik (wymaga umowy i klucza API).
 * Konfiguracja przez zmienne środowiskowe — endpointy mogą się różnić w zależności od umowy.
 */

export type OdjazdAutobusu = {
  departureUid: string;
  stopId: string;
  stopName: string;
  lineLabel: string;
  destination: string | null;
  carrier: string | null;
  plannedWhenIso: string;
};

function enabled(): boolean {
  return (
    String(process.env.TRANSPORT_EPODROZNIK_ENABLED ?? "0") === "1" &&
    !!process.env.EPODROZNIK_API_KEY?.trim()
  );
}

function baseUrl(): string {
  return (process.env.EPODROZNIK_API_BASE_URL ?? "https://api.e-podroznik.pl").replace(/\/+$/, "");
}

function departuresPath(): string {
  return process.env.EPODROZNIK_DEPARTURES_PATH?.trim() || "/v1/departures/nearby";
}

export function epodroznikSkonfigurowany(): boolean {
  return enabled();
}

/** Pobiera odjazdy autobusowe w pobliżu punktu (jeśli API dostępne). */
export async function pobierzOdjazdyEpodroznik(args: {
  lat: number;
  lon: number;
  radiusM?: number;
  hoursAhead?: number;
}): Promise<OdjazdAutobusu[]> {
  if (!enabled()) return [];

  const radiusM = args.radiusM ?? 5000;
  const hoursAhead = args.hoursAhead ?? 24;

  const res = await fetch(`${baseUrl()}${departuresPath()}`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EPODROZNIK_API_KEY}`,
      Accept: "application/json",
    },
    body: JSON.stringify({
      latitude: args.lat,
      longitude: args.lon,
      radiusMeters: radiusM,
      hoursAhead,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`e-podróżnik HTTP ${res.status}${t ? `: ${t.slice(0, 150)}` : ""}`);
  }

  const json = (await res.json()) as unknown;
  const items = Array.isArray(json)
    ? json
    : json && typeof json === "object" && Array.isArray((json as { items?: unknown }).items)
      ? ((json as { items: unknown[] }).items ?? [])
      : [];

  const out: OdjazdAutobusu[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const planned =
      (typeof o.plannedAt === "string" && o.plannedAt) ||
      (typeof o.departureTime === "string" && o.departureTime) ||
      null;
    const stopId = String(o.stopId ?? o.stop_id ?? "unknown");
    const lineLabel = String(o.lineName ?? o.line ?? o.route ?? "Autobus");
    if (!planned) continue;
    out.push({
      departureUid: String(o.id ?? o.uid ?? `${stopId}-${planned}-${lineLabel}`),
      stopId,
      stopName: String(o.stopName ?? o.stop_name ?? "Przystanek"),
      lineLabel,
      destination: typeof o.destination === "string" ? o.destination : null,
      carrier: typeof o.carrier === "string" ? o.carrier : null,
      plannedWhenIso: planned,
    });
  }

  return out.sort((a, b) => Date.parse(a.plannedWhenIso) - Date.parse(b.plannedWhenIso));
}
