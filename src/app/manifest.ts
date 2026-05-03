import type { MetadataRoute } from "next";

const baza = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://naszawies.pl").replace(/\/$/, "");

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "naszawies.pl — cyfrowy dom polskiej wsi",
    short_name: "naszawies",
    description:
      "Katalog wsi, mapa, panel mieszkańca i sołtysa: świetlica, dokumenty, społeczność. Zainstaluj jak aplikację na telefonie.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "portrait-primary",
    background_color: "#f5f1e8",
    theme_color: "#2d5a2d",
    lang: "pl",
    dir: "ltr",
    categories: ["lifestyle", "social", "utilities"],
    shortcuts: [
      {
        name: "Powiadomienia",
        short_name: "Powiadomienia",
        url: "/panel/powiadomienia",
        description: "Wiadomości z panelu",
      },
      {
        name: "Panel",
        short_name: "Panel",
        url: "/panel",
        description: "Panel użytkownika",
      },
    ],
    icons: [
      {
        src: `${baza}/api/pwa/icon/192`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${baza}/api/pwa/icon/512`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
