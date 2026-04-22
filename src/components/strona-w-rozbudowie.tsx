import Link from "next/link";

type Props = {
  tytul: string;
  opis: string;
  kodDokumentacji?: string;
};

/** Placeholder dla tras opisanych w FRONTEND.md — do zastąpienia funkcjami MVP. */
export function StronaWRozbudowie({ tytul, opis, kodDokumentacji }: Props) {
  return (
    <main className="mx-auto min-h-[60vh] max-w-2xl px-5 py-16 text-stone-800">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="mb-4 font-serif text-3xl text-green-950">{tytul}</h1>
      <p className="mb-6 leading-relaxed text-stone-700">{opis}</p>
      {kodDokumentacji ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          Specyfikacja w pakiecie projektu:{" "}
          <code className="rounded bg-white px-1.5 py-0.5">{kodDokumentacji}</code>
        </p>
      ) : null}
    </main>
  );
}
