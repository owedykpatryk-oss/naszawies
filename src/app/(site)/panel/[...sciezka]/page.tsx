import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: { sciezka: string[] } };

export function generateMetadata({ params }: Props): Metadata {
  const sc = params.sciezka.join(" / ");
  return { title: `Panel — ${sc}` };
}

/** Moduły roli i podstrony panelu (np. /panel/soltys/…) — placeholder pod rozbudowę. */
export default function PanelModulPage({ params }: Props) {
  const sciezka = params.sciezka.filter(Boolean);

  return (
    <main>
      <h1 className="mb-4 font-serif text-3xl text-green-950">Panel: {sciezka.join(" → ")}</h1>
      <p className="mb-6 leading-relaxed text-stone-700">
        Ta sekcja jest w przygotowaniu. Wróć do{" "}
        <Link href="/panel" className="font-medium text-green-800 underline">
          głównego panelu
        </Link>{" "}
        lub wybierz moduł z menu po lewej stronie.
      </p>
    </main>
  );
}
