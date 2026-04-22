import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regulamin",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="mb-6 font-serif text-3xl text-green-950">Regulamin</h1>
      <p className="mb-4 leading-relaxed">
        Regulamin platformy w wersji Word jest w pakiecie projektu. Przed
        uruchomieniem rejestracji użytkowników opublikuj tu treść zatwierdzoną
        prawnie (patrz dokumentacja w folderze{" "}
        <code className="rounded bg-stone-100 px-1">Cloude Docs</code>).
      </p>
      <p className="leading-relaxed">
        Pytania:{" "}
        <a className="text-green-800 underline" href="mailto:kontakt@naszawies.pl">
          kontakt@naszawies.pl
        </a>
        .
      </p>
    </main>
  );
}
