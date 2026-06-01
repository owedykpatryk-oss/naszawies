import type { Metadata } from "next";
import Script from "next/script";
import { StronaGlownaJsonLd } from "@/components/landing/strona-glowna-json-ld";
import { pobierzStatystykiKataloguWsi } from "@/lib/landing/statystyki-katalogu-wsi";
import { pobierzSzablonHtmlLandingu } from "@/lib/landing/pobierz-szablon-html-landingu";
import { wstrzyknijStatystykiWHtmlLandingu } from "@/lib/landing/wstrzyknij-placeholdery-html";
import "../styles/landing-trasy.css";
import "../styles/landing-wow.css";
import "../styles/landing.css";

export const revalidate = 120;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description:
    "Bezpłatna platforma dla sołtysów i mieszkańców: profil wsi, świetlica, rynek lokalny, firmy i sklepy, przypomnienia (śmieci, podatki, działki). Katalog i mapa po zalogowaniu.",
};

export default async function Home() {
  const htmlRaw = pobierzSzablonHtmlLandingu();
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
      <Script src="/landing-app.js" strategy="lazyOnload" />
    </>
  );
}
