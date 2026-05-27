import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { LogowanieProwiderzy } from "../logowanie/logowanie-prowiderzy";
import { RejestracjaFormularz } from "./rejestracja-formularz";

export const metadata: Metadata = {
  title: "Rejestracja",
  description: "Załóż konto na naszawies.pl.",
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function RejestracjaPage({ searchParams }: Props) {
  const pochodzenie = pobierzPochodzeniePubliczne();
  const nastepnyParam = searchParams.next;
  const nastepna =
    typeof nastepnyParam === "string" ? bezpiecznaSciezkaNastepna(nastepnyParam) : "/panel";

  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect(nastepna);
    }
  } catch {
    // brak env — strona dalej pokaże formularz
  }

  return (
    <main className="mx-auto min-w-0 max-w-md py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Rejestracja</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        <strong>To samo konto</strong> dla każdego: mieszkaniec, sołtys i inne role to osobny krok{" "}
        <em>po</em> założeniu konta (wniosek do wsi, akceptacja sołtysa, ewentualnie zespół
        naszawies.pl przy roli sołtysa). Tutaj tylko zakładasz logowanie — bez wyboru „jestem
        sołtysem” w sensie prawnym.
      </p>
      {nastepna !== "/panel" ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          Po rejestracji wrócisz do: <strong>{nastepna}</strong>
        </p>
      ) : null}
      <LogowanieProwiderzy pochodzeniePubliczne={pochodzenie} nastepnaSciezka={nastepna} />
      <p className="mt-8 text-center text-sm text-stone-500">lub zarejestruj się e-mailem</p>
      <RejestracjaFormularz pochodzeniePubliczne={pochodzenie} nastepnaSciezka={nastepna} />
    </main>
  );
}
