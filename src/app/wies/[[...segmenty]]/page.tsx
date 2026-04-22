import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: { segmenty?: string[] } };

export function generateMetadata({ params }: Props): Metadata {
  const s = params.segmenty ?? [];
  const tytul =
    s.length >= 4
      ? `${decodeURIComponent(s[3] ?? "").replace(/-/g, " ")} — profil wsi`
      : "Profil wsi";
  return { title: tytul };
}

/** URL zgodnie z dokumentacją: /wies/[woj]/[powiat]/[gmina]/[slug]/...podstrony */
export default function WiesCatchAllPage({ params }: Props) {
  const segmenty = params.segmenty ?? [];
  const [woj, powiat, gmina, slug, ...reszta] = segmenty;

  if (!woj || !powiat || !gmina || !slug) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
        <p className="mb-4">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Niepełny adres wsi</h1>
        <p className="mt-2 text-stone-600">
          Oczekiwany format:{" "}
          <code className="rounded bg-stone-100 px-1 text-sm">
            /wies/województwo/powiat/gmina/slug
          </code>
        </p>
      </main>
    );
  }

  const nazwaWyswietlana = decodeURIComponent(slug).replace(/-/g, " ");
  const podstrona = reszta.length ? reszta.join(" / ") : "strona główna profilu";

  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="mb-2 font-serif text-3xl text-green-950">{nazwaWyswietlana}</h1>
      <p className="mb-1 text-sm text-stone-600">
        {woj} · {powiat} · {gmina}
      </p>
      <p className="mb-6 text-stone-700">
        Sekcja: <strong>{podstrona}</strong>. Pełny profil wsi, ogłoszenia, świetlica i
        mapa — wg{" "}
        <code className="rounded bg-stone-100 px-1 text-sm">
          docs/FEATURES.md
        </code>{" "}
        (Faza 1–2).
      </p>
    </main>
  );
}
