import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Zgłoszenia (sołtys)",
};

/** Szkielet modułu — tabela `issues` i RLS są w migracji; UI wg ROADMAP (faza 2). */
export default function SoltysZgloszeniaPage() {
  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Zgłoszenia i usterki</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
        Tutaj powstanie lista zgłoszeń z wsi (np. dziura w drodze, uszkodzona lampa), ze statusami dla sołtysa.
        Backend: tabela <code className="rounded bg-stone-100 px-1 text-xs">issues</code> w Supabase — interfejs w
        przygotowaniu.
      </p>
      <p className="mt-4 text-sm text-stone-600">
        Mieszkaniec zgłasza w{" "}
        <Link href="/panel/mieszkaniec/zgloszenia" className="text-green-800 underline">
          swoim panelu
        </Link>
        .
      </p>
    </main>
  );
}
