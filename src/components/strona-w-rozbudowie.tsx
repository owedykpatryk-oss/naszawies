import Link from "next/link";

type Props = {
  tytul: string;
  opis: string;
};

/** Placeholder pod strony w przygotowaniu. */
export function StronaWRozbudowie({ tytul, opis }: Props) {
  return (
    <main className="mx-auto min-h-[60vh] max-w-2xl px-5 py-16 text-stone-800">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="mb-4 font-serif text-3xl text-green-950">{tytul}</h1>
      <p className="leading-relaxed text-stone-700">{opis}</p>
    </main>
  );
}
