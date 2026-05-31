import type { NextResponse } from "next/server";
import { budujCspProdukcji } from "@/lib/bezpieczenstwo/csp-produkcji";

/** Nagłówki bezpieczeństwa — uzupełniają next.config (middleware może je nadpisać na odpowiedzi). */
export function dolaczNaglowkiBezpieczenstwa(odpowiedz: NextResponse): NextResponse {
  const prod = process.env.NODE_ENV === "production";

  odpowiedz.headers.set("X-Content-Type-Options", "nosniff");
  odpowiedz.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  odpowiedz.headers.set("X-DNS-Prefetch-Control", "on");
  odpowiedz.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  odpowiedz.headers.set("Cross-Origin-Resource-Policy", "same-site");
  odpowiedz.headers.set("X-Frame-Options", "SAMEORIGIN");
  odpowiedz.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  );

  if (prod) {
    odpowiedz.headers.set("Content-Security-Policy", budujCspProdukcji());
    odpowiedz.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  } else {
    odpowiedz.headers.set("Content-Security-Policy", "frame-ancestors 'self' https://vercel.com");
  }

  return odpowiedz;
}
