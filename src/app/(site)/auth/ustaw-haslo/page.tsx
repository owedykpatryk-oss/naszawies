import type { Metadata } from "next";
import Link from "next/link";
import { UstawHasloFormularz } from "./ustaw-haslo-formularz";

export const metadata: Metadata = {
  title: "Nowe hasło",
  robots: { index: false, follow: false },
};

export default function UstawHasloPage() {
  return (
    <main className="mx-auto min-w-0 max-w-md py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/logowanie" className="text-green-800 underline">
          ← Logowanie
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Ustaw nowe hasło</h1>
      <p className="mt-2 text-sm text-stone-600">
        Ta strona działa po kliknięciu linku z wiadomości resetującej hasło.
      </p>
      <UstawHasloFormularz />
    </main>
  );
}
