import { headers } from "next/headers";

/** Bazowy URL strony (np. do linków w e-mailu Supabase) z nagłówków żądania. */
export function pobierzPochodzeniePubliczne(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
