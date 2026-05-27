import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  tytul: string;
  opis?: ReactNode;
  powrotHref?: string;
  powrotEtykieta?: string;
  akcje?: ReactNode;
  dzieci: ReactNode;
  /** Szerszy układ (generator, społeczność) */
  szeroki?: boolean;
};

export function PanelStronaSoltysa({
  tytul,
  opis,
  powrotHref = "/panel/soltys",
  powrotEtykieta = "← Panel sołtysa",
  akcje,
  dzieci,
  szeroki = false,
}: Props) {
  return (
    <main className={szeroki ? "max-w-none" : undefined}>
      <div className="no-print mb-4 flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-stone-500">
          <Link href={powrotHref} className="link-panel">
            {powrotEtykieta}
          </Link>
        </p>
        {akcje ? <div className="flex flex-wrap gap-2">{akcje}</div> : null}
      </div>

      <header className="panel-informacji-hero">
        <h1 className="tytul-sekcji-panelu relative">{tytul}</h1>
        {opis ? <div className="relative mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">{opis}</div> : null}
      </header>

      <div className={szeroki ? "mt-8" : "mt-8 max-w-5xl"}>{dzieci}</div>
    </main>
  );
}
