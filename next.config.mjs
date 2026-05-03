import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nie ustawiaj X-Frame-Options: SAMEORIGIN — blokuje iframe podglądu w panelu Vercel (inna domena).
          // Ochrona przed clickjackingiem: tylko my i panel Vercel mogą osadzać stronę w ramce.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://vercel.com",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
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
