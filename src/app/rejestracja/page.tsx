import type { Metadata } from "next";
import Link from "next/link";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { RejestracjaFormularz } from "./rejestracja-formularz";

export const metadata: Metadata = {
  title: "Rejestracja",
  description: "Załóż konto na naszawies.pl.",
};

export default function RejestracjaPage() {
  const pochodzenie = pobierzPochodzeniePubliczne();

  return (
    <main className="mx-auto max-w-md px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Rejestracja</h1>
      <p className="mt-2 text-sm text-stone-600">
        Pierwszy krok konta (e-mail + hasło). Wybór roli we wsi i weryfikacja sołtysa — w kolejnych
        krokach roadmapy.
      </p>
      <RejestracjaFormularz pochodzeniePubliczne={pochodzenie} />
    </main>
  );
}
