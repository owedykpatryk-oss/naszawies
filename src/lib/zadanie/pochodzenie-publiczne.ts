import { headers } from "next/headers";

/**
 * Bazowy URL strony (OAuth `redirectTo`, linki w e-mailu Supabase).
 * Ustaw `NEXT_PUBLIC_SITE_URL` na produkcji / preview (np. `https://naszawies.pl`), jeśli nagłówki proxy nie zwracają poprawnego hosta.
 */
export function pobierzPochodzeniePubliczne(): string {
  const jawny = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (jawny) {
    return jawny.replace(/\/$/, "");
  }

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
