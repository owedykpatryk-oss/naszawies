import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Zgłoszenia",
};

/** Szkielet formularza zgłoszeń — RLS i tabela `issues` w migracji. */
export default function MieszkaniecZgloszeniaPage() {
  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Zgłoszenia problemów</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
        Formularz zgłoszeń (drogi, oświetlenie, inne) będzie tu dostępny po dołączeniu do wsi. Sołtys zobaczy listę
        w{" "}
        <Link href="/panel/soltys/zgloszenia" className="text-green-800 underline">
          panelu sołtysa
        </Link>
        .
      </p>
    </main>
  );
}
