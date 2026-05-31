import type { ReactNode } from "react";
import Link from "next/link";
import { LinkPomocyKontekstowej } from "@/components/pomoc/link-pomocy-kontekstowej";

type Props = {
  tytul: string;
  opis?: ReactNode;
  hrefPomocy?: string;
  etykietaPomocy?: string;
  /** Mały nagłówek nad tytułem */
  etykieta?: string;
  /** Link powrotu nad hero */
  hrefPowrotu?: string;
  etykietaPowrotu?: string;
  /** domyslny = zielony hero panelu; rynek = pomarańczowo-zielony */
  wariant?: "domyslny" | "rynek";
  dzieci?: ReactNode;
  className?: string;
};

function klasyNaglowka(wariant: Props["wariant"]): string {
  if (wariant === "rynek") return "rynek-hero-wow mb-6 !p-5 sm:!p-7";
  return "modul-naglowek-wrap";
}

/** Nagłówek modułu panelu z opcjonalną ikoną pomocy. */
export function NaglowekModuluPanelu({
  tytul,
  opis,
  hrefPomocy,
  etykietaPomocy,
  etykieta,
  hrefPowrotu,
  etykietaPowrotu,
  wariant = "domyslny",
  dzieci,
  className = "",
}: Props) {
  const klasyWrap = `${klasyNaglowka(wariant)} ${className}`.trim();

  return (
    <header className={klasyWrap}>
      <div className="relative z-[1] flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {hrefPowrotu ? (
            <Link
              href={hrefPowrotu}
              className="mb-2 inline-block text-xs font-medium text-green-800 underline decoration-emerald-600/40 underline-offset-2 hover:decoration-emerald-800"
            >
              {etykietaPowrotu ?? "← Wróć"}
            </Link>
          ) : null}
          {etykieta ? (
            wariant === "rynek" ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-orange-200/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-950">
                <span aria-hidden>🏷️</span>
                {etykieta}
              </p>
            ) : (
              <p className="etykieta-modulu">{etykieta}</p>
            )
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="tytul-sekcji-panelu">{tytul}</h1>
            {hrefPomocy ? (
              <LinkPomocyKontekstowej href={hrefPomocy} label={etykietaPomocy ?? `Pomoc: ${tytul}`} />
            ) : null}
          </div>
          {opis ? (
            <div className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">{opis}</div>
          ) : null}
        </div>
        {dzieci ? <div className="shrink-0">{dzieci}</div> : null}
      </div>
    </header>
  );
}

/** Preset nagłówka dla podstron panelu mieszkańca. */
export function NaglowekModuluMieszkaniec(
  props: Omit<Props, "hrefPowrotu" | "etykietaPowrotu"> & { hrefPowrotu?: string; etykietaPowrotu?: string },
) {
  return (
    <NaglowekModuluPanelu
      hrefPowrotu="/panel/mieszkaniec"
      etykietaPowrotu="← Panel mieszkańca"
      etykieta={props.etykieta ?? "Mieszkaniec"}
      {...props}
    />
  );
}

/** Preset nagłówka dla podstron panelu sołtysa. */
export function NaglowekModuluSoltysa(
  props: Omit<Props, "hrefPowrotu" | "etykietaPowrotu"> & { hrefPowrotu?: string; etykietaPowrotu?: string },
) {
  return (
    <NaglowekModuluPanelu
      hrefPowrotu="/panel/soltys"
      etykietaPowrotu="← Panel sołtysa"
      etykieta={props.etykieta ?? "Sołtys"}
      {...props}
    />
  );
}
