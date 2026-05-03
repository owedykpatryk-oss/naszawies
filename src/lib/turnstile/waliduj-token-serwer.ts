/**
 * Weryfikacja odpowiedzi Cloudflare Turnstile po stronie serwera.
 * Gdy brak `TURNSTILE_SECRET_KEY` — zwraca `{ ok: true }` (dev / stopniowe wdrożenie).
 */
export async function walidujOdpowiedzTurnstile(
  responseToken: string | null | undefined,
): Promise<{ ok: boolean; pominiety: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: true, pominiety: true };
  }

  const token = responseToken?.trim();
  if (!token) {
    return { ok: false, pominiety: false };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    return { ok: false, pominiety: false };
  }

  const json = (await res.json()) as { success?: boolean };
  return { ok: Boolean(json.success), pominiety: false };
}
