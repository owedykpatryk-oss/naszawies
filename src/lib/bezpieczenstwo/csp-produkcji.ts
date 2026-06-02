/** Wspólna polityka CSP produkcyjna (next.config + middleware). */
export function budujCspProdukcji(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
  /** Na Vercel (build + runtime) — Preview Comments wymaga vercel.live w CSP z obu źródeł nagłówków. */
  const vercelLive = process.env.VERCEL === "1";

  const connectSrc = [
    "'self'",
    supabaseUrl,
    supabaseUrl ? supabaseUrl.replace("https://", "wss://") : "",
    "https://challenges.cloudflare.com",
    "https://plausible.io",
    "https://*.tile.openstreetmap.org",
    "https://nominatim.openstreetmap.org",
    "https://api.mapbox.com",
    "https://*.geoportal.gov.pl",
    ...(vercelLive
      ? ["https://vercel.live", "https://*.pusher.com", "wss://*.pusher.com"]
      : []),
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
    "https://*.basemaps.cartocdn.com",
    "https://integracja.gugik.gov.pl",
    "https://server.arcgisonline.com",
    "https://*.arcgisonline.com",
    r2Base,
    "https://cdn.naszawies.pl",
    ...(vercelLive ? ["https://vercel.com", "https://vercel.live"] : []),
  ]
    .filter(Boolean)
    .join(" ");

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://challenges.cloudflare.com",
    "https://plausible.io",
    ...(vercelLive ? ["https://vercel.live"] : []),
  ].join(" ");

  const styleSrc = ["'self'", "'unsafe-inline'", ...(vercelLive ? ["https://vercel.com"] : [])].join(
    " ",
  );

  const frameSrc = [
    "https://challenges.cloudflare.com",
    ...(vercelLive ? ["https://vercel.live"] : []),
  ].join(" ");

  const fontSrc = ["'self'", "data:", ...(vercelLive ? ["https://vercel.live"] : [])].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'self' https://vercel.com",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    `font-src ${fontSrc}`,
    `frame-src ${frameSrc}`,
    "worker-src 'self' blob:",
  ].join("; ");
}
