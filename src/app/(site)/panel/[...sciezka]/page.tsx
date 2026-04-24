import type { Metadata } from "next";

type Props = { params: { sciezka: string[] } };

export function generateMetadata({ params }: Props): Metadata {
  const sc = params.sciezka.join(" / ");
  return { title: `Panel — ${sc}` };
}

/** Moduły roli i podstrony panelu (np. /panel/soltys/…) — do rozbudowy wg roadmapy. */
export default function PanelModulPage({ params }: Props) {
  const sciezka = params.sciezka.filter(Boolean);
  const opis = `Ścieżka: /panel/${sciezka.join("/")}. Ogłoszenia, świetlica, mieszkańcy — kolejne fazy.`;

  return (
    <main>
      <h1 className="mb-4 font-serif text-3xl text-green-950">Panel: {sciezka.join(" → ")}</h1>
      <p className="mb-6 leading-relaxed text-stone-700">{opis}</p>
      <p className="rounded-lg border border-stone-200 bg-stone-100/80 p-4 text-sm text-stone-600">
        Specyfikacja w pakiecie projektu:{" "}
        <code className="rounded bg-white px-1.5 py-0.5">Cloude Docs/naszawies-package/frontend/FRONTEND.md</code>
      </p>
    </main>
  );
}
