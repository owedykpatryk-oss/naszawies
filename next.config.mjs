import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "leaflet",
      "leaflet.markercluster",
      "@supabase/supabase-js",
      "html2pdf.js",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: (() => {
      const wzorce = [
        { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      ];
      const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim();
      if (r2) {
        try {
          const u = new URL(r2);
          wzorce.push({ protocol: "https", hostname: u.hostname, pathname: "/**" });
        } catch {
          /* ignore */
        }
      }
      return wzorce;
    })(),
  },
  async headers() {
    const prod = process.env.NODE_ENV === "production";
    const security = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'self' https://vercel.com",
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    ];
    if (prod) {
      security.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers: security,
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path(favicon.ico|icon|apple-icon|opengraph-image)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
};

const konfiguracjaSentry = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: {
    disable: true,
  },
};

export default process.env.SENTRY_DSN?.trim()
  ? withSentryConfig(nextConfig, konfiguracjaSentry)
  : nextConfig;
