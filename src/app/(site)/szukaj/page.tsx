import type { Metadata } from "next";
import Link from "next/link";
import { wymagajLogowaniaStrona } from "@/lib/auth/wymagaj-logowania-strona";
import { SzukajKatalog } from "./szukaj-katalog";

export const metadata: Metadata = {
  title: "Szukaj wsi",
  description: "Wyszukiwarka katalogu wsi — dostępna po zalogowaniu w naszawies.pl.",
  robots: { index: false, follow: false },
};

type Props = { searchParams?: { q?: string | string[] } };

export default async function SzukajPage({ searchParams }: Props) {
  const qParam = searchParams?.q;
  const qPoczatkowe = Array.isArray(qParam) ? qParam[0] : qParam;
  const search = qPoczatkowe ? `?q=${encodeURIComponent(qPoczatkowe)}` : "";
  await wymagajLogowaniaStrona("/szukaj", search);

  return (
    <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Szukaj wsi</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Wpisz <strong>nazwę wsi</strong> albo fragment <strong>gminy, powiatu czy województwa</strong> — pokażemy
        miejscowości z katalogu serwisu (import TERYT). Przy wielu wynikach z tej samej gminy pojawi się skrót do{" "}
        <strong>listy wszystkich miejscowości w gminie</strong>.
      </p>
      <p className="mt-2 text-xs text-stone-500">
        Liczba przy województwie to wpisy w bazie naszawies.pl — jeśli w regionie widać mało miejscowości, administrator
        może uzupełnić katalog importem SIMC (<code className="text-[11px]">npm run import:simc</code>).
      </p>
      <SzukajKatalog key={qPoczatkowe ?? ""} poczatkoweZapytanie={qPoczatkowe} />
    </main>
  );
}
