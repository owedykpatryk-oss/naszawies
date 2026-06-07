import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import { BanerCiasteczek } from "@/components/baner-ciasteczek";
import { OdswiezSesjeKlient } from "@/components/auth/odswiez-sesje-klient";
import { PwaServiceWorkerKlient } from "@/components/pwa/pwa-service-worker-klient";
import { pobierzBazeUrlWitryny } from "@/lib/seo/konfiguracja-domeny";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const domenaPlausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export const metadata: Metadata = {
  metadataBase: new URL(pobierzBazeUrlWitryny()),
  title: {
    default: "naszawies.pl — cyfrowy dom polskiej wsi",
    template: "%s | naszawies.pl",
  },
  description:
    "Bezpłatna platforma dla sołtysów i mieszkańców. Rezerwuj świetlicę, planuj układ stołów, łącz wieś. Od sołtysów, dla sołtysów.",
  keywords: [
    "wieś",
    "sołtys",
    "świetlica",
    "rezerwacja świetlicy",
    "naszawies",
    "Polska",
    "sołectwo",
  ],
  authors: [{ name: "naszawies.pl" }],
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "https://naszawies.pl",
    siteName: "naszawies.pl",
    title: "naszawies.pl — cyfrowy dom polskiej wsi",
    description:
      "Bezpłatna platforma dla sołtysów i mieszkańców. Rezerwuj świetlicę, planuj układ stołów, łącz wieś.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "naszawies.pl" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "naszawies.pl — cyfrowy dom polskiej wsi",
    description:
      "Bezpłatna platforma dla sołtysów i mieszkańców. Bez reklam, bez opłat dla wsi.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/api/pwa/icon/192", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: [{ url: "/icon", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: "naszawies.pl",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/blog/rss.xml", title: "RSS — blog naszawies.pl" }],
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2d5a2d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

  return (
    <html lang="pl" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        {supabaseUrl ? (
          <>
            <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseUrl} />
          </>
        ) : null}
      </head>
      <body className={inter.className}>
        {domenaPlausible ? (
          <Script
            defer
            data-domain={domenaPlausible}
            src="https://plausible.io/js/script.js"
            strategy="lazyOnload"
          />
        ) : null}
        {children}
        <OdswiezSesjeKlient />
        <PwaServiceWorkerKlient />
        <BanerCiasteczek />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
