import type { Metadata } from "next";
import Link from "next/link";
import { ZglosNaruszenieFormularz } from "@/components/zglos-naruszenie-formularz";

export const metadata: Metadata = {
  title: "Zgłoś naruszenie",
  description: "Zgłaszanie nielegalnych lub szkodliwych treści (DSA).",
};

export default function ZglosNaruszeniePage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Zgłaszanie naruszeń (DSA)</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        Jeśli na naszawies.pl znalazłeś treść niezgodną z prawem lub regulaminem, możesz zgłosić to poniżej. W razie
        problemów z formularzem napisz na{" "}
        <a href="mailto:moderacja@naszawies.pl" className="text-green-800 underline">
          moderacja@naszawies.pl
        </a>{" "}
        lub{" "}
        <a href="mailto:dsa@naszawies.pl" className="text-green-800 underline">
          dsa@naszawies.pl
        </a>{" "}
        — podaj URL, opis i dane kontaktowe.
      </p>
      <ZglosNaruszenieFormularz />
    </main>
  );
}
