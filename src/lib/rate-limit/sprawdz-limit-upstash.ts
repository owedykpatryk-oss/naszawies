import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type NazwaLimituApi =
  | "waitlist"
  | "kontakt"
  | "rejestracja"
  | "zglos_naruszenie"
  | "szukaj_wies"
  | "logowanie"
  | "api_publiczne"
  | "transport_pkp_szukaj";

let redisInstancja: Redis | null | undefined;

/** Upstash Search (Vercel Marketplace) nie obsługuje poleceń Redis wymaganych przez @upstash/ratelimit. */
function czyToRedisRestUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("search.upstash.io")) return false;
    return host.endsWith(".upstash.io");
  } catch {
    return false;
  }
}

function pobierzRedis(): Redis | null {
  if (redisInstancja !== undefined) return redisInstancja;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redisInstancja = null;
    return null;
  }
  if (!czyToRedisRestUrl(url)) {
    redisInstancja = null;
    return null;
  }
  redisInstancja = new Redis({ url, token });
  return redisInstancja;
}

type SlownikLimitow = Record<NazwaLimituApi, Ratelimit>;

let limitery: SlownikLimitow | null | undefined;

function pobierzLubUtworzLimitery(): SlownikLimitow | null {
  if (limitery !== undefined) return limitery;
  const redis = pobierzRedis();
  if (!redis) {
    limitery = null;
    return null;
  }
  limitery = {
    waitlist: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      prefix: "rl:waitlist",
      analytics: true,
    }),
    kontakt: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "rl:kontakt",
      analytics: true,
    }),
    rejestracja: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "rl:rejestracja",
      analytics: true,
    }),
    zglos_naruszenie: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "rl:zglos_naruszenie",
      analytics: true,
    }),
    szukaj_wies: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "rl:szukaj_wies",
      analytics: true,
    }),
    logowanie: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "10 m"),
      prefix: "rl:logowanie",
      analytics: true,
    }),
    api_publiczne: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      prefix: "rl:api",
      analytics: true,
    }),
    transport_pkp_szukaj: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 m"),
      prefix: "rl:transport-pkp",
      analytics: true,
    }),
  };
  return limitery;
}

/**
 * Gdy brak Upstash — w produkcji prosty limit w pamięci procesu (per instancja).
 * W dev bez blokady, żeby nie utrudniać pracy lokalnej.
 */
const LIMITY_PAMIEC: Record<NazwaLimituApi, { limit: number; oknoMs: number }> = {
  waitlist: { limit: 3, oknoMs: 60 * 60 * 1000 },
  kontakt: { limit: 5, oknoMs: 60 * 60 * 1000 },
  rejestracja: { limit: 5, oknoMs: 60 * 60 * 1000 },
  zglos_naruszenie: { limit: 10, oknoMs: 24 * 60 * 60 * 1000 },
  szukaj_wies: { limit: 60, oknoMs: 60 * 1000 },
  logowanie: { limit: 30, oknoMs: 10 * 60 * 1000 },
  api_publiczne: { limit: 120, oknoMs: 60 * 1000 },
  transport_pkp_szukaj: { limit: 20, oknoMs: 10 * 60 * 1000 },
};

type WpisPamiec = { count: number; resetAt: number };
const pamiecLimitow = new Map<string, WpisPamiec>();

function sprawdzLimitPamiec(
  nazwa: NazwaLimituApi,
  identyfikator: string,
): { ok: true } | { ok: false; retryPoSekundach: number } {
  const cfg = LIMITY_PAMIEC[nazwa];
  const klucz = `${nazwa}:${identyfikator}`;
  const teraz = Date.now();
  let wpis = pamiecLimitow.get(klucz);
  if (!wpis || teraz >= wpis.resetAt) {
    wpis = { count: 0, resetAt: teraz + cfg.oknoMs };
    pamiecLimitow.set(klucz, wpis);
  }
  wpis.count += 1;
  if (wpis.count > cfg.limit) {
    return {
      ok: false,
      retryPoSekundach: Math.max(1, Math.ceil((wpis.resetAt - teraz) / 1000)),
    };
  }
  return { ok: true };
}

export function ipZRequestu(naglowki: Headers): string {
  const forwarded = naglowki.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return naglowki.get("x-real-ip")?.trim() || "unknown";
}

export async function sprawdzLimitApi(
  nazwa: NazwaLimituApi,
  identyfikator: string,
): Promise<{ ok: true } | { ok: false; retryPoSekundach: number }> {
  const limity = pobierzLubUtworzLimitery();
  if (!limity) {
    if (process.env.NODE_ENV === "production") {
      return sprawdzLimitPamiec(nazwa, identyfikator);
    }
    return { ok: true };
  }

  try {
    const wynik = await limity[nazwa].limit(identyfikator);
    if (!wynik.success) {
      const retryPoSekundach = Math.max(
        1,
        Math.ceil((wynik.reset - Date.now()) / 1000),
      );
      return { ok: false, retryPoSekundach };
    }
    return { ok: true };
  } catch {
    if (process.env.NODE_ENV === "production") {
      return sprawdzLimitPamiec(nazwa, identyfikator);
    }
    return { ok: true };
  }
}
