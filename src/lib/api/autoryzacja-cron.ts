/**
 * Autoryzacja zadań cron / maintenance (CRON_SECRET).
 * Wyłącznie nagłówek `Authorization: Bearer <CRON_SECRET>` — bez query ani alternatywnych nagłówków,
 * żeby sekret nie trafiał do logów URL (Vercel, referery).
 */
export function czyZapytanieCronAutoryzowane(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  return token === expected;
}
