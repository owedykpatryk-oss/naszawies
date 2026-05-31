import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type Props = {
  wies: WiesPubliczna;
  siteUrl: string;
};

export function WiesJsonLd({ wies, siteUrl }: Props) {
  const url = `${siteUrl.replace(/\/$/, "")}${sciezkaProfiluWsi(wies)}`;
  const json = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: wies.name,
    description: wies.description ?? `Profil wsi ${wies.name} na naszawies.pl`,
    url,
    ...(wies.cover_image_url ? { image: wies.cover_image_url } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: wies.name,
      addressRegion: wies.voivodeship,
      addressCountry: "PL",
    },
    ...(wies.latitude != null && wies.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: wies.latitude,
            longitude: wies.longitude,
          },
        }
      : {}),
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: `${wies.commune}, pow. ${wies.county}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
