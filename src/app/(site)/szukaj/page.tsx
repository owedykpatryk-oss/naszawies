import type { Metadata } from "next";
import Link from "next/link";
import { HeroModuluPublicznego } from "@/components/wspolne/hero-modulu-publicznego";
import { SzukajKatalog } from "./szukaj-katalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Szukaj wsi — katalog miejscowości",
  description:
    "Wyszukiwarka katalogu polskich wsi na naszawies.pl — znajdź swoją miejscowość, profil wsi, ogłoszenia i społeczność lokalną.",
  alternates: { canonical: "/szukaj" },
  openGraph: {
    title: "Szukaj wsi — naszawies.pl",
    description: "Katalog miejscowości — profile wsi, rynek lokalny i społeczność.",
    url: "/szukaj",
  },
};

type Props = { searchParams?: { q?: string | string[] } };

export default async function SzukajPage({ searchParams }: Props) {
  const qParam = searchParams?.q;
  const qPoczatkowe = Array.isArray(qParam) ? qParam[0] : qParam;

  return (
    <main className="page-shell px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="font-medium text-green-800 underline decoration-emerald-600/40 underline-offset-2">
          ← Strona główna
        </Link>
        {" · "}
        <Link href="/rynek" className="font-medium text-green-800 underline decoration-emerald-600/40 underline-offset-2">
          Rynek lokalny
        </Link>
      </p>

      <HeroModuluPublicznego
        etykieta="Katalog TERYT"
        tytul="Szukaj wsi"
        wariant="szukaj"
        opis="Wpisz nazwę wsi albo fragment gminy, powiatu czy województwa — pokażemy miejscowości z katalogu serwisu. Przy wielu wynikach z tej samej gminy pojawi się skrót do listy wszystkich miejscowości w gminie."
        dzieci={
          <div className="rounded-xl border border-emerald-300/50 bg-white/80 px-4 py-3 text-sm text-emerald-950 shadow-sm backdrop-blur-sm">
            Znalazłeś swoją wieś?{" "}
            <Link href="/rejestracja?intencja=mieszkaniec" className="font-semibold text-green-900 underline">
              Załóż konto
            </Link>{" "}
            i dołącz do społeczności — za darmo.
          </div>
        }
      />

      <p className="mt-6 text-xs text-stone-500">
        Liczba przy województwie to wpisy w bazie naszawies.pl — jeśli w regionie widać mało miejscowości, administrator
        może uzupełnić katalog importem SIMC.
      </p>

      <div className="mt-8">
        <SzukajKatalog key={qPoczatkowe ?? ""} poczatkoweZapytanie={qPoczatkowe} />
      </div>
    </main>
  );
}
