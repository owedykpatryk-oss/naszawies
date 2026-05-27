import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type NazwaLimituApi =
  | "waitlist"
  | "kontakt"
  | "zglos_naruszenie"
  | "szukaj_wies"
  | "logowanie"
  | "api_publiczne";

let redisInstancja: Redis | null | undefined;

function pobierzRedis(): Redis | null {
  if (redisInstancja !== undefined) return redisInstancja;
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.UPSTASH_SEARCH_REST_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.UPSTASH_SEARCH_REST_TOKEN?.trim();
  if (!url || !token) {
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
  };
  return limitery;
}

/** IP z nagłówków Vercel / reverse proxy. */
export function ipZRequestu(naglowki: Headers): string {
  const forwarded = naglowki.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return naglowki.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Gdy brak `UPSTASH_REDIS_*` — zwraca `{ ok: true }` (brak blokady w dev).
 */
export async function sprawdzLimitApi(
  nazwa: NazwaLimituApi,
  identyfikator: string,
): Promise<{ ok: true } | { ok: false; retryPoSekundach: number }> {
  const limity = pobierzLubUtworzLimitery();
  if (!limity) return { ok: true };

  const wynik = await limity[nazwa].limit(identyfikator);
  if (!wynik.success) {
    const retryPoSekundach = Math.max(
      1,
      Math.ceil((wynik.reset - Date.now()) / 1000),
    );
    return { ok: false, retryPoSekundach };
  }
  return { ok: true };
}
