import { Suspense } from "react";
import { NawigacjaPaneluGrupowana } from "@/components/panel/nawigacja-panelu-grupowana";
import { PanelSciezkaKontekstu } from "@/components/panel/panel-sciezka-kontekstu";
import { GRUPY_NAWIGACJI_MOJE } from "@/lib/panel/konfiguracja-nawigacji-modulow";

export default function MojeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <Suspense fallback={<div className="panel-nawigacja-szklo mb-8 h-20 animate-pulse rounded-2xl" aria-hidden />}>
        <NawigacjaPaneluGrupowana grupy={GRUPY_NAWIGACJI_MOJE} ariaLabel="Moje — nawigacja" />
      </Suspense>
      <PanelSciezkaKontekstu />
      {children}
    </div>
  );
}
