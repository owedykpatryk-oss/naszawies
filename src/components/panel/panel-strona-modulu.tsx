import type { ReactNode } from "react";
import { NaglowekModuluPanelu } from "@/components/pomoc/naglowek-modulu-panelu";

type Props = {
  etykieta?: string;
  tytul: string;
  opis?: ReactNode;
  hrefPowrotu?: string;
  etykietaPowrotu?: string;
  hrefPomocy?: string;
  etykietaPomocy?: string;
  wariantNaglowka?: "domyslny" | "rynek";
  akcje?: ReactNode;
  dzieci: ReactNode;
  /** Szerszy układ (generator, społeczność) */
  szeroki?: boolean;
  odstepTresci?: "sm" | "md" | "lg";
};

/** Spójna otoczka podstrony panelu (nagłówek hero + treść). */
export function PanelStronaModulu({
  etykieta,
  tytul,
  opis,
  hrefPowrotu,
  etykietaPowrotu,
  hrefPomocy,
  etykietaPomocy,
  wariantNaglowka = "domyslny",
  akcje,
  dzieci,
  szeroki = false,
  odstepTresci = "md",
}: Props) {
  const odstep = odstepTresci === "sm" ? "mt-4" : odstepTresci === "lg" ? "mt-10" : "mt-6";

  return (
    <main className={szeroki ? "max-w-none" : undefined}>
      {akcje ? (
        <div className="no-print mb-3 flex flex-wrap items-center justify-end gap-2">{akcje}</div>
      ) : null}
      <NaglowekModuluPanelu
        etykieta={etykieta}
        tytul={tytul}
        opis={opis}
        hrefPowrotu={hrefPowrotu}
        etykietaPowrotu={etykietaPowrotu}
        hrefPomocy={hrefPomocy}
        etykietaPomocy={etykietaPomocy}
        wariant={wariantNaglowka}
      />
      <div className={`${odstep} ${szeroki ? "max-w-none" : "max-w-7xl"}`}>{dzieci}</div>
    </main>
  );
}
