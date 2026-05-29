import type { HubRynkuDane } from "@/lib/marketplace/pobierz-hub-rynku";

export function RynekHubJsonLd({ hub }: { hub: HubRynkuDane }) {
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://naszawies.pl/rynek#webpage",
        url: "https://naszawies.pl/rynek",
        name: "Rynek lokalny — miód, sery, działki, maszyny rolnicze",
        description: `Darmowy rynek lokalny we wsiach Polski. ${hub.lacznieOgloszen} ogłoszeń w ${hub.lacznieWsi} miejscowościach. Bez prowizji i bez płatności online — kontakt między sąsiadami.`,
        inLanguage: "pl-PL",
        isPartOf: { "@id": "https://naszawies.pl/#website" },
      },
      {
        "@type": "ItemList",
        name: "Rynki lokalne we wsiach",
        numberOfItems: hub.wsie.length,
        itemListElement: hub.wsie.slice(0, 30).map((w, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `Rynek lokalny — ${w.name}`,
          url: `https://naszawies.pl${w.sciezkaRynek}`,
        })),
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
