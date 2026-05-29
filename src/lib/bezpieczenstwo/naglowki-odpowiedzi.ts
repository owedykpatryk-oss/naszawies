import type { NextResponse } from "next/server";

function cspProdukcji(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";

  const connectSrc = [
    "'self'",
    supabaseUrl,
    supabaseUrl ? `${supabaseUrl.replace("https://", "wss://")}` : "",
    "https://challenges.cloudflare.com",
    "https://plausible.io",
    "https://*.tile.openstreetmap.org",
    "https://nominatim.openstreetmap.org",
    "https://api.mapbox.com",
    "https://*.geoportal.gov.pl",
  ]
    .filter(Boolean)
    .join(" ");

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://*.supabase.co",
    "https://tile.openstreetmap.org",
    "https://*.tile.openstreetmap.org",
    r2Base,
    "https://cdn.naszawies.pl",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'self' https://vercel.com",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://plausible.io",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    "font-src 'self' data:",
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
  ].join("; ");
}

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
    odpowiedz.headers.set("Content-Security-Policy", cspProdukcji());
    odpowiedz.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  } else {
    odpowiedz.headers.set("Content-Security-Policy", "frame-ancestors 'self' https://vercel.com");
  }

  return odpowiedz;
}
