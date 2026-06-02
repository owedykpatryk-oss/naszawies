import type { Metadata } from "next";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";

type WydarzenieMeta = {
  title: string;
  description: string | null;
  location_text: string | null;
  starts_at: string;
  event_kind: string;
};

type WiesMeta = { name: string };

export function metadataWydarzeniaPublicznego(
  wies: WiesMeta,
  wydarzenie: WydarzenieMeta,
  sciezkaWydarzenia: string,
): Metadata {
  const data = new Date(wydarzenie.starts_at).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const opis =
    wydarzenie.description?.replace(/\s+/g, " ").trim().slice(0, 155) ??
    `${etykietaRodzajuWydarzenia(wydarzenie.event_kind)} we wsi ${wies.name} — ${data}${wydarzenie.location_text ? `, ${wydarzenie.location_text}` : ""}.`;

  return {
    title: `${wydarzenie.title} — ${wies.name}`,
    description: opis,
    alternates: { canonical: sciezkaWydarzenia },
    openGraph: {
      title: wydarzenie.title,
      description: opis,
      url: sciezkaWydarzenia,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${wydarzenie.title} · ${wies.name}`,
      description: opis,
    },
  };
}
