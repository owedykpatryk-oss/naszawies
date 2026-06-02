import { motywOrganizacji } from "@/lib/wies/motyw-organizacji-publicznej";
import type { WierszOrganizacjiPublicznej } from "@/lib/wies/pobierz-strone-organizacji";
import { okladkaOrganizacjiZProfilu } from "@/lib/wies/profil-organizacji-meta";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import type { SegmentOrganizacji } from "@/lib/wies/sciezka-organizacji-publicznej";

type WiesPubliczna = {
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

type WydarzenieSkrot = {
  title: string;
  starts_at: string;
  location_text: string | null;
};

function typSchemaOrg(segment: SegmentOrganizacji): string {
  switch (segment) {
    case "parafia":
      return "PlaceOfWorship";
    case "sport":
      return "SportsOrganization";
    case "osp":
      return "Organization";
    case "kgw":
      return "Organization";
    case "lowiectwo":
      return "Organization";
    default:
      return "Organization";
  }
}

function dodatkowyTyp(segment: SegmentOrganizacji): string | undefined {
  switch (segment) {
    case "parafia":
      return "CatholicChurch";
    case "osp":
      return "FireDepartment";
    case "kgw":
      return "NGO";
    default:
      return undefined;
  }
}

type Props = {
  wies: WiesPubliczna;
  org: WierszOrganizacjiPublicznej;
  segment: SegmentOrganizacji;
  urlStrony: string;
  siteUrl: string;
  wydarzenia?: WydarzenieSkrot[];
};

export function OrganizacjaJsonLd({ wies, org, segment, urlStrony, siteUrl, wydarzenia = [] }: Props) {
  const baza = siteUrl.replace(/\/$/, "");
  const urlPelny = `${baza}${urlStrony}`;
  const sciezkaWsi = sciezkaProfiluWsi(wies);
  const motyw = motywOrganizacji(segment);
  const okladka = okladkaOrganizacjiZProfilu(org.profile_data);
  const nadchodzace = wydarzenia
    .filter((w) => new Date(w.starts_at) >= new Date())
    .slice(0, 5);

  const organizacja: Record<string, unknown> = {
    "@type": typSchemaOrg(segment),
    "@id": `${urlPelny}#organization`,
    name: org.name,
    description:
      org.short_description ??
      `${motyw.etykietaTypu} w miejscowości ${wies.name} — kontakt, kalendarz i informacje na naszawies.pl`,
    url: urlPelny,
    ...(okladka ? { image: okladka } : {}),
    ...(org.contact_phone ? { telephone: org.contact_phone } : {}),
    ...(org.contact_email ? { email: org.contact_email } : {}),
    ...(org.meeting_place
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: org.meeting_place,
            addressLocality: wies.name,
            addressRegion: wies.voivodeship,
            addressCountry: "PL",
          },
        }
      : {
          address: {
            "@type": "PostalAddress",
            addressLocality: wies.name,
            addressRegion: wies.voivodeship,
            addressCountry: "PL",
          },
        }),
    parentOrganization: {
      "@type": "Place",
      name: wies.name,
      url: `${baza}${sciezkaWsi}`,
    },
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: `${wies.commune}, pow. ${wies.county}`,
    },
  };

  const dodatkowy = dodatkowyTyp(segment);
  if (dodatkowy) {
    organizacja.additionalType = `https://schema.org/${dodatkowy}`;
  }

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      "@id": `${urlPelny}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: wies.name,
          item: `${baza}${sciezkaWsi}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: motyw.etykietaTypu,
          item: urlPelny,
        },
      ],
    },
    organizacja,
    {
      "@type": "WebPage",
      "@id": `${urlPelny}#webpage`,
      url: urlPelny,
      name: `${org.name} — ${motyw.etykietaTypu}`,
      description: org.short_description ?? `${motyw.etykietaTypu} · ${wies.name}`,
      inLanguage: "pl-PL",
      isPartOf: { "@id": `${baza}/#website` },
      about: { "@id": `${urlPelny}#organization` },
      breadcrumb: { "@id": `${urlPelny}#breadcrumb` },
      ...(okladka ? { primaryImageOfPage: okladka } : {}),
    },
  ];

  if (nadchodzace.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": `${urlPelny}#events`,
      name: `Nadchodzące wydarzenia — ${org.name}`,
      itemListElement: nadchodzace.map((w, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Event",
          name: w.title,
          startDate: w.starts_at,
          ...(w.location_text
            ? {
                location: {
                  "@type": "Place",
                  name: w.location_text,
                  address: { "@type": "PostalAddress", addressLocality: wies.name, addressCountry: "PL" },
                },
              }
            : {}),
          organizer: { "@id": `${urlPelny}#organization` },
        },
      })),
    });
  }

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
