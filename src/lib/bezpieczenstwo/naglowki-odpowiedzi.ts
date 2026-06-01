import type { NextResponse } from "next/server";
import { budujCspProdukcji } from "@/lib/bezpieczenstwo/csp-produkcji";

function czySciezkaEmbed(sciezka: string): boolean {
  return sciezka.startsWith("/embed/");
}

/** CSP dla stron osadzanych w iframe na stronie gminy. */
function budujCspEmbed(): string {
  const bazowy = budujCspProdukcji();
  return bazowy.replace(/frame-ancestors[^;]*/i, "frame-ancestors *");
}

/** Nagłówki bezpieczeństwa — uzupełniają next.config (middleware może je nadpisać na odpowiedzi). */
export function dolaczNaglowkiBezpieczenstwa(odpowiedz: NextResponse, sciezka = ""): NextResponse {
  const prod = process.env.NODE_ENV === "production";
  const embed = czySciezkaEmbed(sciezka);

  odpowiedz.headers.set("X-Content-Type-Options", "nosniff");
  odpowiedz.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  odpowiedz.headers.set("X-DNS-Prefetch-Control", "on");
  odpowiedz.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  odpowiedz.headers.set(
    "Cross-Origin-Resource-Policy",
    embed ? "cross-origin" : "same-site",
  );
  if (!embed) {
    odpowiedz.headers.set("X-Frame-Options", "SAMEORIGIN");
  } else {
    odpowiedz.headers.delete("X-Frame-Options");
  }
  odpowiedz.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  );

  if (prod) {
    odpowiedz.headers.set("Content-Security-Policy", embed ? budujCspEmbed() : budujCspProdukcji());
    odpowiedz.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  } else {
    odpowiedz.headers.set(
      "Content-Security-Policy",
      embed ? "frame-ancestors *" : "frame-ancestors 'self' https://vercel.com",
    );
  }

  return odpowiedz;
}
