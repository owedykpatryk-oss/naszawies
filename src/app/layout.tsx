import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://naszawies.pl"),
  title: {
    default: "naszawies.pl — cyfrowy dom polskiej wsi",
    template: "%s | naszawies.pl",
  },
  description:
    "Bezpłatna platforma dla sołtysów i mieszkańców. Rezerwuj świetlicę, planuj układ stołów, łącz wieś. Od sołtysów, dla sołtysów.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${fraunces.variable} ${inter.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
