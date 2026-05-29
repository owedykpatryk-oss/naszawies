import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { ponowJesliRedirect } from "@/lib/next/ponow-redirect";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { LogowanieFormularz } from "./logowanie-formularz";
import { LogowanieProwiderzy } from "./logowanie-prowiderzy";
import { LogoNaszawiesWycentrowane } from "@/components/marka/logo-naszawies";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Logowanie do naszawies.pl.",
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function LogowaniePage({ searchParams }: Props) {
  const pochodzenie = pobierzPochodzeniePubliczne();
  const nastepnyParam = searchParams.next;
  const nastepna =
    typeof nastepnyParam === "string" ? bezpiecznaSciezkaNastepna(nastepnyParam) : "/panel";
  const bladParam = searchParams.blad;
  const kodBledu = typeof bladParam === "string" ? bladParam : undefined;
  const szczegolParam = searchParams.szczegol;
  const szczegolBledu = typeof szczegolParam === "string" ? szczegolParam.slice(0, 400) : undefined;
  const emailParam = searchParams.email;
  const emailStartowy = typeof emailParam === "string" ? emailParam.slice(0, 200) : "";

  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect(nastepna);
    }
  } catch (error) {
    ponowJesliRedirect(error);
    // Brak zmiennych env — strona pokaże komunikat z formularza OAuth / konfiguracji
  }

  return (
    <main className="mx-auto min-w-0 max-w-md py-12 text-stone-800 sm:py-16">
      <LogoNaszawiesWycentrowane />
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50/90 p-6 shadow-[0_20px_50px_-20px_rgba(21,60,40,0.18)] ring-1 ring-stone-900/[0.04] sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
          aria-hidden
        />
        <h1 className="relative font-serif text-3xl tracking-tight text-green-950 sm:text-[2rem]">Logowanie</h1>
        <p className="relative mt-2 text-sm leading-relaxed text-stone-600">
          Zaloguj się przez Google albo e-mail i hasło. Po zalogowaniu wrócisz do miejsca, z którego przyszedłeś
          lub przejdziesz do panelu konta.
        </p>
        <div className="relative mt-6">
          <LogowanieProwiderzy pochodzeniePubliczne={pochodzenie} nastepnaSciezka={nastepna} />
        </div>
        <p className="relative mt-8 text-center text-xs font-medium uppercase tracking-wider text-stone-500">
          lub e-mail
        </p>
        <LogowanieFormularz
          nastepnaSciezka={nastepna}
          kodBledu={kodBledu}
          szczegolBledu={szczegolBledu}
          emailStartowy={emailStartowy}
        />
        <div className="relative mt-6 rounded-2xl border border-stone-200/80 bg-white/80 p-4 text-sm text-stone-700">
          <p className="font-medium text-stone-900">Po co się logować?</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-stone-600">
            <li>Masz panel mieszkańca lub sołtysa zależnie od roli.</li>
            <li>Dostajesz powiadomienia o zmianach i decyzjach.</li>
            <li>Wracasz do swoich spraw bez ponownego szukania.</li>
          </ul>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          Strona główna
        </Link>
      </p>
    </main>
  );
}
