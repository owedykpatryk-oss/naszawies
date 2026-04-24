import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fotokronika",
};

/** Szkielet — dodawanie zdjęć / propozycji do albumów; wymaga pełnej ścieżki z Storage i moderacją sołtysa. */
export default function MieszkaniecFotokronikaPage() {
  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Fotokronika</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
        Moduł w planie: dodawanie zdjęć do wydarzeń wsi, albumy, ewentualna moderacja. Tabele w schemacie — UI w
        kolejnej iteracji. Podgląd dla sołtysa:{" "}
        <Link href="/panel/soltys/fotokronika" className="text-green-800 underline">
          panel sołtysa → Fotokronika
        </Link>
        .
      </p>
    </main>
  );
}
