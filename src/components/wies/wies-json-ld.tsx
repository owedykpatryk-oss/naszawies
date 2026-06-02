import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import {
  sciezkaPelnejStronyOrganizacji,
  segmentDlaOrganizacji,
} from "@/lib/wies/sciezka-organizacji-publicznej";

type OrganizacjaSkrot = {
  id: string;
  name: string;
  group_type: string;
  public_slug?: string | null;
};

type Props = {
  wies: WiesPubliczna;
  siteUrl: string;
  organizacje?: OrganizacjaSkrot[];
};

export function WiesJsonLd({ wies, siteUrl, organizacje = [] }: Props) {
  const baza = siteUrl.replace(/\/$/, "");
  const url = `${baza}${sciezkaProfiluWsi(wies)}`;

  const place = {
    "@type": "Place",
    "@id": `${url}#place`,
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

  const graph: Record<string, unknown>[] = [place];

  const linkiOrg = organizacje
    .map((o) => {
      const sciezka = sciezkaPelnejStronyOrganizacji(wies, o);
      if (!sciezka) return null;
      const segment = segmentDlaOrganizacji(o.group_type, o.name);
      return {
        name: o.name,
        url: `${baza}${sciezka}`,
        segment,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  if (linkiOrg.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": `${url}#organizacje`,
      name: `Organizacje we wsi ${wies.name}`,
      numberOfItems: linkiOrg.length,
      itemListElement: linkiOrg.map((o, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: o.name,
        url: o.url,
      })),
    });
  }

  const json = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
