import { createSchema } from "@/lib/seo/create-schema";
import type { Okruszek } from "@/lib/seo/generate-breadcrumbs";
import type { SchemaArtykul, SchemaFaqPozycja } from "@/lib/seo/create-schema";

type Props = {
  artykul?: SchemaArtykul;
  faq?: SchemaFaqPozycja[];
  breadcrumbs?: Okruszek[];
  listing?: { tytul: string; opis: string; sciezka: string };
};

export function BlogJsonLd({ artykul, faq, breadcrumbs, listing }: Props) {
  const schema = createSchema();
  const bloki: object[] = [];

  if (listing) bloki.push(schema.blogListing(listing.tytul, listing.opis, listing.sciezka));
  if (artykul) bloki.push(schema.article(artykul));
  if (faq?.length) {
    const faqSchema = schema.faq(faq);
    if (faqSchema) bloki.push(faqSchema);
  }
  if (breadcrumbs?.length) bloki.push(schema.breadcrumb(breadcrumbs));

  if (!bloki.length) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(bloki.length === 1 ? bloki[0] : bloki) }}
    />
  );
}
