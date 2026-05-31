import type { ReactNode } from "react";
import { NaglowekModuluSoltysa } from "@/components/pomoc/naglowek-modulu-panelu";

type Props = {
  tytul: string;
  opis?: ReactNode;
  powrotHref?: string;
  powrotEtykieta?: string;
  akcje?: ReactNode;
  dzieci: ReactNode;
  /** Szerszy układ (generator, społeczność) */
  szeroki?: boolean;
  etykieta?: string;
  hrefPomocy?: string;
};

export function PanelStronaSoltysa({
  tytul,
  opis,
  powrotHref = "/panel/soltys",
  powrotEtykieta = "← Panel sołtysa",
  akcje,
  dzieci,
  szeroki = false,
  etykieta = "Sołtys",
  hrefPomocy,
}: Props) {
  return (
    <main className={szeroki ? "max-w-none" : undefined}>
      {akcje ? (
        <div className="no-print mb-3 flex flex-wrap items-start justify-end gap-2">{akcje}</div>
      ) : null}

      <NaglowekModuluSoltysa
        etykieta={etykieta}
        tytul={tytul}
        opis={opis}
        hrefPowrotu={powrotHref}
        etykietaPowrotu={powrotEtykieta}
        hrefPomocy={hrefPomocy}
      />

      <div className={`mt-6 ${szeroki ? "" : "max-w-7xl"}`}>{dzieci}</div>
    </main>
  );
}
