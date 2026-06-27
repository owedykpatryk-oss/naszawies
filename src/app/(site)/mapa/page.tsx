import type { Metadata } from "next";
import { BramkiChronionychTras } from "@/components/panel/bramki-chronionych-tras";
import { LinkPomocyKontekstowej } from "@/components/pomoc/link-pomocy-kontekstowej";
import { MapaStronaKlient } from "@/components/mapa/mapa-strona-klient";

export const metadata: Metadata = {
  title: "Mapa wsi",
  description:
    "Mapa katalogu wsi po zalogowaniu: granice sołectwa, punkty POI, łowiectwo, polowania i transport — gdy sołectwo doda dane w serwisie.",
  robots: { index: false, follow: false },
};

export default function MapaPage() {
  return (
    <>
      <BramkiChronionychTras />
      <main className="mapa-strona-glowna mapa-strona-glowna--immersive flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b border-green-900/8 bg-gradient-to-r from-white via-emerald-50/30 to-white px-2 py-1.5 backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <h1 className="font-serif text-sm font-medium leading-tight text-green-950 sm:text-lg">Mapa wiosek</h1>
            <LinkPomocyKontekstowej
              href="/pomoc#mapa"
              label="Pomoc: mapa wsi"
              tytul="Katalog administracyjny, warstwy POI, GPS, filtry w adresie URL"
            />
          </div>
        </header>

        <MapaStronaKlient />
      </main>
    </>
  );
}
