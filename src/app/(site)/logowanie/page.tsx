import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { LogowanieFormularz } from "./logowanie-formularz";
import { LogowanieProwiderzy } from "./logowanie-prowiderzy";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Logowanie do naszawies.pl.",
};

function bezpiecznaSciezkaNastepna(n?: string) {
  if (!n || !n.startsWith("/") || n.startsWith("//")) return "/panel";
  return n;
}

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

  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect(nastepna);
    }
  } catch {
    // Brak zmiennych env — strona pokaże komunikat z formularza OAuth / konfiguracji
  }

  return (
    <main className="mx-auto min-w-0 max-w-md py-12 text-stone-800 sm:py-16">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="font-medium text-green-900 underline decoration-emerald-800/30 underline-offset-2 hover:decoration-emerald-800">
          ← Strona główna
        </Link>
      </p>
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-b from-white to-stone-50/90 p-6 shadow-[0_20px_50px_-20px_rgba(21,60,40,0.18)] ring-1 ring-stone-900/[0.04] sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
          aria-hidden
        />
        <h1 className="relative font-serif text-3xl tracking-tight text-green-950 sm:text-[2rem]">Logowanie</h1>
        <p className="relative mt-2 text-sm leading-relaxed text-stone-600">
          Zaloguj się przez Google lub GitHub, albo użyj e-maila i hasła. Po zalogowaniu przejdziesz
          do panelu (albo do adresu z parametru{" "}
          <code className="rounded-md bg-stone-100/90 px-1.5 py-0.5 font-mono text-xs text-stone-800">next</code>).
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
        />
      </div>
    </main>
  );
}
