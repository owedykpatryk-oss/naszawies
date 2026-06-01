import type { StatystykiKataloguWsi } from "@/lib/landing/statystyki-katalogu-wsi";

export function StronaGlownaJsonLd({ stats }: { stats: StatystykiKataloguWsi | null }) {
  const opis =
    stats != null
      ? `Bezpłatna platforma dla sołtysów i mieszkańców. W katalogu ${stats.wsieLacznie} miejscowości (${stats.wsieZAktywnymProfilem} z aktywnym profilem). Rynek lokalny: ${stats.ogloszeniaRynek} ogłoszeń, ${stats.profileFirmRynek} profili firm. Katalog i mapa po zalogowaniu.`
      : "Bezpłatna platforma dla sołtysów i mieszkańców. Profil wsi, świetlica, rynek lokalny, przypomnienia mieszkańców — katalog i mapa po zalogowaniu.";

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://naszawies.pl/#website",
        url: "https://naszawies.pl",
        name: "naszawies.pl",
        description: opis,
        inLanguage: "pl-PL",
        publisher: { "@id": "https://naszawies.pl/#organization" },
      },
      {
        "@type": "Organization",
        "@id": "https://naszawies.pl/#organization",
        name: "naszawies.pl",
        url: "https://naszawies.pl",
        logo: {
          "@type": "ImageObject",
          url: "https://naszawies.pl/icon",
          width: 32,
          height: 32,
        },
        description: opis,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
