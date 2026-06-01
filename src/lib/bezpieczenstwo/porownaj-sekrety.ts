import { timingSafeEqual } from "node:crypto";

/** Stałe porównanie sekretów (cron, webhooki) — ogranicza wyciek przez timing. */
export function porownajSekrety(otrzymany: string, oczekiwany: string): boolean {
  const a = otrzymany.trim();
  const b = oczekiwany.trim();
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}
