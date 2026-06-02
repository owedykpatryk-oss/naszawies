export type WynikParsowaniaGpx = {
  distanceMeters: number | null;
  durationSeconds: number | null;
  startTime: string | null;
  title: string | null;
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function wyciagnijTagi(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

function wyciagnijPunktyTrkpt(xml: string): Array<{ lat: number; lon: number; time: string | null }> {
  const re = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/gi;
  const pts: Array<{ lat: number; lon: number; time: string | null }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const lat = parseFloat(m[1]);
    const lon = parseFloat(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const inner = m[3];
    const timeMatch = inner.match(/<time>([^<]+)<\/time>/i);
    pts.push({ lat, lon, time: timeMatch?.[1]?.trim() ?? null });
  }
  return pts;
}

function wyciagnijPunktyRtept(xml: string): Array<{ lat: number; lon: number; time: string | null }> {
  const re = /<rtept\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/rtept>/gi;
  const pts: Array<{ lat: number; lon: number; time: string | null }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const lat = parseFloat(m[1]);
    const lon = parseFloat(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const inner = m[3];
    const timeMatch = inner.match(/<time>([^<]+)<\/time>/i);
    pts.push({ lat, lon, time: timeMatch?.[1]?.trim() ?? null });
  }
  return pts;
}

function polaczPunktyGpx(xml: string): Array<{ lat: number; lon: number; time: string | null }> {
  const trk = wyciagnijPunktyTrkpt(xml);
  if (trk.length >= 2) return trk;
  return wyciagnijPunktyRtept(xml);
}

/** Prosty parser GPX (trk/trkpt, rte/rtept) — dystans, czas trwania, data startu. */
export function parsujGpx(xml: string): WynikParsowaniaGpx {
  const trimmed = xml.trim().slice(0, 2_000_000);
  if (!trimmed.includes("<gpx")) {
    return { distanceMeters: null, durationSeconds: null, startTime: null, title: null };
  }

  const names = wyciagnijTagi(trimmed, "name");
  const title = names[0] ?? null;

  const pts = polaczPunktyGpx(trimmed);
  let distanceMeters: number | null = null;
  if (pts.length >= 2) {
    let sum = 0;
    for (let i = 1; i < pts.length; i++) {
      sum += haversineM(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
    }
    distanceMeters = Math.round(sum);
  }

  const times = pts.map((p) => p.time).filter(Boolean) as string[];
  let durationSeconds: number | null = null;
  let startTime: string | null = times[0] ?? null;
  if (times.length >= 2) {
    const t0 = new Date(times[0]).getTime();
    const t1 = new Date(times[times.length - 1]).getTime();
    if (Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0) {
      durationSeconds = Math.round((t1 - t0) / 1000);
      startTime = new Date(t0).toISOString();
    }
  }

  return { distanceMeters, durationSeconds, startTime, title };
}

export function czyUrlStrava(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.hostname.includes("strava.com");
  } catch {
    return false;
  }
}
