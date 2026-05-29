import { LinkPomocyKontekstowej } from "@/components/pomoc/link-pomocy-kontekstowej";

type Props = {
  tytul: string;
  opis?: string;
  hrefPomocy?: string;
  etykietaPomocy?: string;
  /** Mały nagłówek nad tytułem */
  etykieta?: string;
  dzieci?: React.ReactNode;
};

/** Nagłówek modułu panelu z opcjonalną ikoną pomocy. */
export function NaglowekModuluPanelu({ tytul, opis, hrefPomocy, etykietaPomocy, etykieta, dzieci }: Props) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {etykieta ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800/80">{etykieta}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="tytul-sekcji-panelu">{tytul}</h1>
            {hrefPomocy ? (
              <LinkPomocyKontekstowej href={hrefPomocy} label={etykietaPomocy ?? `Pomoc: ${tytul}`} />
            ) : null}
          </div>
          {opis ? <p className="mt-2 max-w-3xl text-sm text-stone-600">{opis}</p> : null}
        </div>
        {dzieci ? <div className="shrink-0">{dzieci}</div> : null}
      </div>
    </header>
  );
}
