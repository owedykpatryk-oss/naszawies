import { Suspense } from "react";
import { PanelSciezkaKontekstu } from "@/components/panel/panel-sciezka-kontekstu";
import { PrzewodnikModuluLeniwy } from "@/components/pomoc/przewodnik-modulu-leniwy";
import { SoltysNawigacja } from "./soltys-nawigacja";

export default function SoltysLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <Suspense
        fallback={
          <div className="no-print mb-8 h-24 animate-pulse rounded-2xl border border-stone-200/60 bg-stone-100/50" />
        }
      >
        <SoltysNawigacja />
      </Suspense>
      <PanelSciezkaKontekstu />
      <Suspense fallback={null}>
        <PrzewodnikModuluLeniwy />
      </Suspense>
      {children}
    </div>
  );
}
