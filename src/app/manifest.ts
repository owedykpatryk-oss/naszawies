import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "naszawies.pl — cyfrowy dom polskiej wsi",
    short_name: "naszawies",
    description:
      "Publiczny profil wsi, panel mieszkańca i sołtysa: świetlica, dokumenty, społeczność. Katalog i mapa po zalogowaniu.",
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
        src: "/marka/logo-naszawies.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/marka/logo-naszawies.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
