import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export type StanOAuthStrava = {
  nonce: string;
  userId: string;
  villageId: string;
  returnTo: string;
  exp: number;
};

const MAX_WIEK_MS = 15 * 60 * 1000;

function sekret(): string {
  return (
    process.env.STRAVA_OAUTH_STATE_SECRET?.trim() ||
    process.env.STRAVA_CLIENT_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "dev-strava-state"
  );
}

function podpis(payloadB64: string): string {
  return createHmac("sha256", sekret()).update(payloadB64).digest("base64url");
}

export function utworzStanOAuthStrava(dane: Omit<StanOAuthStrava, "nonce" | "exp">): string {
  const stan: StanOAuthStrava = {
    ...dane,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + MAX_WIEK_MS,
  };
  const payload = Buffer.from(JSON.stringify(stan)).toString("base64url");
  return `${payload}.${podpis(payload)}`;
}

export function zweryfikujStanOAuthStrava(raw: string | null): StanOAuthStrava | null {
  if (!raw?.includes(".")) return null;
  const [payload, sig] = raw.split(".", 2);
  if (!payload || !sig) return null;
  const oczekiwany = podpis(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(oczekiwany);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const stan = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StanOAuthStrava;
    if (!stan.userId || !stan.villageId || !stan.exp) return null;
    if (Date.now() > stan.exp) return null;
    return stan;
  } catch {
    return null;
  }
}

export function bezpiecznaSciezkaPowrotu(wartosc: string | null | undefined): string {
  if (!wartosc) return "/panel/mieszkaniec";
  let s: string;
  try {
    s = decodeURIComponent(wartosc);
  } catch {
    return "/panel/mieszkaniec";
  }
  if (!s.startsWith("/") || s.startsWith("//")) return "/panel/mieszkaniec";
  return s;
}
