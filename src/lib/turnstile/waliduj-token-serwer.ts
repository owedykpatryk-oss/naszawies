import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";

export type WynikWalidacjiTurnstile =
  | { ok: true; pominiety: boolean }
  | { ok: false; pominiety: false; komunikat: string };

const KOMUNIKATY_BLEDOW: Record<string, string> = {
  "missing-input-response":
    "Brak weryfikacji antyspamowej. Zaznacz pole Cloudflare i spróbuj ponownie.",
  "invalid-input-response":
    "Weryfikacja antyspamowa jest nieprawidłowa. Odśwież stronę i spróbuj ponownie.",
  "timeout-or-duplicate":
    "Weryfikacja wygasła lub została użyta ponownie. Odśwież stronę i spróbuj jeszcze raz.",
  "internal-error": "Chwilowy błąd weryfikacji Cloudflare. Spróbuj ponownie za chwilę.",
};

const KOMUNIKAT_DOMYSLNY =
  "Weryfikacja antybotowa nie powiodła się. Odśwież stronę i spróbuj ponownie.";

function komunikatZBledow(kody: string[] | undefined): string {
  if (!kody?.length) return KOMUNIKAT_DOMYSLNY;
  for (const kod of kody) {
    const msg = KOMUNIKATY_BLEDOW[kod];
    if (msg) return msg;
  }
  return KOMUNIKAT_DOMYSLNY;
}

/**
 * Weryfikacja odpowiedzi Cloudflare Turnstile po stronie serwera.
 * Gdy brak `TURNSTILE_SECRET_KEY` — zwraca `{ ok: true }` (dev / stopniowe wdrożenie).
 */
export async function walidujOdpowiedzTurnstile(
  responseToken: string | null | undefined,
  opcje?: { adresIp?: string },
): Promise<WynikWalidacjiTurnstile> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: true, pominiety: true };
  }

  const token = responseToken?.trim();
  if (!token) {
    return {
      ok: false,
      pominiety: false,
      komunikat: KOMUNIKATY_BLEDOW["missing-input-response"] ?? KOMUNIKAT_DOMYSLNY,
    };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  const ip = opcje?.adresIp?.trim();
  if (ip && ip !== "anonim") {
    body.set("remoteip", ip);
  }

  let res: Response;
  try {
    res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    return {
      ok: false,
      pominiety: false,
      komunikat: "Nie udało się połączyć z weryfikacją Cloudflare. Spróbuj ponownie.",
    };
  }

  if (!res.ok) {
    return { ok: false, pominiety: false, komunikat: KOMUNIKAT_DOMYSLNY };
  }

  const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
  if (json.success) {
    return { ok: true, pominiety: false };
  }

  return {
    ok: false,
    pominiety: false,
    komunikat: komunikatZBledow(json["error-codes"]),
  };
}

/** Skrót dla route handlerów Next.js — IP z nagłówków proxy (Vercel). */
export async function walidujTurnstileZNaglowkow(
  responseToken: string | null | undefined,
  naglowki: Headers,
): Promise<WynikWalidacjiTurnstile> {
  return walidujOdpowiedzTurnstile(responseToken, {
    adresIp: odczytajAdresIpZNaglowkow(naglowki),
  });
}
