import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoNaszawiesWycentrowane } from "@/components/marka/logo-naszawies";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { czyProfilMaAktualnaAkceptacjePrawna } from "@/lib/rodo/czy-ma-akceptacje-prawna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { AkceptacjaRegulaminuKlient } from "./akceptacja-regulaminu-klient";

export const metadata: Metadata = {
  title: "Akceptacja regulaminu",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function AkceptacjaRegulaminuPage({ searchParams }: Props) {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) redirect("/logowanie?next=/panel");

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: profil } = await supabase
    .from("users")
    .select("legal_accepted_at, legal_bundle_version")
    .eq("id", user.id)
    .maybeSingle();

  const nextParam = searchParams.next;
  const nastepna = typeof nextParam === "string" ? bezpiecznaSciezkaNastepna(nextParam) : "/panel";

  if (czyProfilMaAktualnaAkceptacjePrawna(profil)) {
    redirect(nastepna);
  }

  return (
    <main className="mx-auto w-full max-w-7xl py-4">
      <LogoNaszawiesWycentrowane />
      <h1 className="mt-6 text-center font-serif text-2xl text-green-950">Regulamin i prywatność</h1>
      <p className="mt-2 text-center text-sm text-stone-600">
        <Link href="/wyloguj" className="font-medium text-green-800 underline">
          Wyloguj
        </Link>
      </p>
      <div className="mt-8">
        <AkceptacjaRegulaminuKlient nastepnaSciezka={nastepna} />
      </div>
    </main>
  );
}
