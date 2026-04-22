import type { Metadata } from "next";
import Link from "next/link";
import { LogowanieFormularz } from "./logowanie-formularz";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Logowanie do naszawies.pl — Supabase Auth.",
};

function bezpiecznaSciezkaNastepna(n?: string) {
  if (!n || !n.startsWith("/") || n.startsWith("//")) return "/panel";
  return n;
}

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function LogowaniePage({ searchParams }: Props) {
  const nastepnyParam = searchParams.next;
  const nastepna =
    typeof nastepnyParam === "string" ? bezpiecznaSciezkaNastepna(nastepnyParam) : "/panel";
  const bladParam = searchParams.blad;
  const kodBledu = typeof bladParam === "string" ? bladParam : undefined;

  return (
    <main className="mx-auto max-w-md px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Logowanie</h1>
      <p className="mt-2 text-sm text-stone-600">
        Konto z e-mailem i hasłem. Po zalogowaniu przejdziesz do panelu (lub do strony wskazanej w
        linku).
      </p>
      <LogowanieFormularz nastepnaSciezka={nastepna} kodBledu={kodBledu} />
    </main>
  );
}
