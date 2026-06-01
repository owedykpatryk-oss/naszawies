import { Suspense } from "react";
import { NawigacjaPaneluGrupowana } from "@/components/panel/nawigacja-panelu-grupowana";
import { PanelSciezkaKontekstu } from "@/components/panel/panel-sciezka-kontekstu";
import { PrzewodnikModuluLeniwy } from "@/components/pomoc/przewodnik-modulu-leniwy";
import {
  GRUPY_NAWIGACJI_MIESZKANIEC,
  SZYBKIE_LINKI_MIESZKANIEC,
} from "@/lib/panel/konfiguracja-nawigacji-modulow";

function NawigacjaSzkielet() {
  return <div className="panel-nawigacja-szklo mb-8 h-28 animate-pulse rounded-2xl" aria-hidden />;
}

export default function MieszkaniecLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <Suspense fallback={<NawigacjaSzkielet />}>
        <NawigacjaPaneluGrupowana
          grupy={GRUPY_NAWIGACJI_MIESZKANIEC}
          szybkieLinki={SZYBKIE_LINKI_MIESZKANIEC}
          ariaLabel="Panel mieszkańca"
        />
      </Suspense>
      <PanelSciezkaKontekstu />
      <Suspense fallback={null}>
        <PrzewodnikModuluLeniwy />
      </Suspense>
      {children}
    </div>
  );
}
