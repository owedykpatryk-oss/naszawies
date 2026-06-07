import {
  walidujTurnstileZNaglowkow,
  type WynikWalidacjiTurnstile,
} from "@/lib/turnstile/waliduj-token-serwer";

const KOMUNIKAT_BRAK_TOKENU =
  "Brak weryfikacji antyspamowej. Zaznacz pole Cloudflare i spróbuj ponownie.";

/**
 * Supabase Auth ma własny Turnstile (npm run wlacz:turnstile-supabase).
 * Token jest jednorazowy — nie wolno go zużywać przez siteverify przed signIn/signUp.
 */
export function czySupabaseAuthCaptcha(): boolean {
  const jawne = process.env.SUPABASE_AUTH_CAPTCHA_ENABLED?.trim().toLowerCase();
  if (jawne === "0" || jawne === "false" || jawne === "no") return false;
  if (jawne === "1" || jawne === "true" || jawne === "yes") return true;
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

/** Wymaga tokenu gdy Turnstile skonfigurowany; przy Supabase Auth nie wywołuje siteverify. */
export async function walidujTurnstilePrzedAuth(
  responseToken: string | null | undefined,
  naglowki: Headers,
): Promise<WynikWalidacjiTurnstile> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: true, pominiety: true };
  }

  const token = responseToken?.trim();
  if (!token) {
    return { ok: false, pominiety: false, komunikat: KOMUNIKAT_BRAK_TOKENU };
  }

  if (czySupabaseAuthCaptcha()) {
    return { ok: true, pominiety: false };
  }

  return walidujTurnstileZNaglowkow(token, naglowki);
}

export function tokenCaptchaDlaSupabase(
  responseToken: string | null | undefined,
): string | undefined {
  if (!czySupabaseAuthCaptcha()) return undefined;
  const token = responseToken?.trim();
  return token || undefined;
}
