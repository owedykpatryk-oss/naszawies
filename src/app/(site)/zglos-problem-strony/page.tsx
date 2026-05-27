import type { Metadata } from "next";
import Link from "next/link";
import { ZglosProblemStronyFormularz } from "@/components/pomoc/zglos-problem-strony-formularz";

export const metadata: Metadata = {
  title: "Zgłoś problem ze stroną",
  description: "Formularz zgłoszenia błędu technicznego, logowania lub panelu na naszawies.pl.",
};

export default function ZglosProblemStronyPage() {
  return (
    <main className="page-shell max-w-xl py-10 sm:py-14">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/pomoc" className="text-green-800 underline">
          ← Centrum pomocy
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Zgłoś problem ze stroną</h1>
      <p className="mt-2 text-sm text-stone-600">
        Opisz błąd lub trudność z korzystaniem z serwisu. To nie jest zgłoszenie do sołtysa o sprawach we wsi.
      </p>
      <div className="mt-8">
        <ZglosProblemStronyFormularz />
      </div>
    </main>
  );
}
