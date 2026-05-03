import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Script from "next/script";
import { StronaGlownaJsonLd } from "@/components/landing/strona-glowna-json-ld";
import { pobierzStatystykiKataloguWsi } from "@/lib/landing/statystyki-katalogu-wsi";
import { wstrzyknijStatystykiWHtmlLandingu } from "@/lib/landing/wstrzyknij-placeholdery-html";
import "../styles/landing-trasy.css";

export const revalidate = 120;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description:
    "Bezpłatna platforma dla sołtysów i mieszkańców: katalog i mapa wsi, świetlica, dokumenty, blog, wiadomości lokalne, rynek — bez opłat dla wsi.",
};

export default async function Home() {
  const sciezkaHtml = path.join(process.cwd(), "src/content/landing-body.html");
  const htmlRaw = fs.readFileSync(sciezkaHtml, "utf8");
  const stats = await pobierzStatystykiKataloguWsi();
  const html = wstrzyknijStatystykiWHtmlLandingu(htmlRaw, stats);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  return (
    <>
      <Script id="naszawies-turnstile-public" strategy="beforeInteractive">
        {`window.__NEXT_PUBLIC_TURNSTILE_SITE_KEY__=${JSON.stringify(turnstileSiteKey)};window.__waitlistTurnstileToken="";`}
      </Script>
      <StronaGlownaJsonLd stats={stats} />
      <main id="strona-glowna" aria-label="Strona główna naszawies.pl">
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </main>
      <Script src="/landing-app.js" strategy="afterInteractive" />
    </>
  );
}
