import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import { BanerCiasteczek } from "@/components/baner-ciasteczek";
import "../styles/landing.css";
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
  metadataBase: new URL("https://naszawies.pl"),
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
  },
  twitter: {
    card: "summary",
    title: "naszawies.pl — cyfrowy dom polskiej wsi",
    description:
      "Bezpłatna platforma dla sołtysów i mieszkańców. Bez reklam, bez opłat dla wsi.",
  },
  robots: {
    index: true,
    follow: true,
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
  return (
    <html lang="pl" className={`${fraunces.variable} ${inter.variable}`}>
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
        <BanerCiasteczek />
      </body>
    </html>
  );
}
