import type { StatystykiKataloguWsi } from "@/lib/landing/statystyki-katalogu-wsi";

export function StronaGlownaJsonLd({ stats }: { stats: StatystykiKataloguWsi | null }) {
  const opis =
    stats != null
      ? `Bezpłatna platforma dla sołtysów i mieszkańców. W katalogu ${stats.wsieLacznie} miejscowości, z czego ${stats.wsieZAktywnymProfilem} z aktywnym profilem publicznym.`
      : "Bezpłatna platforma dla sołtysów i mieszkańców. Katalog wsi, mapa, rezerwacja świetlicy, dokumenty.";

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
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://naszawies.pl/szukaj?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://naszawies.pl/#organization",
        name: "naszawies.pl",
        url: "https://naszawies.pl",
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
