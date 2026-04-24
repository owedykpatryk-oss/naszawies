import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { LogowanieFormularz } from "./logowanie-formularz";
import { LogowanieProwiderzy } from "./logowanie-prowiderzy";

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
    <main className="mx-auto max-w-md px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Logowanie</h1>
      <p className="mt-2 text-sm text-stone-600">
        Zaloguj się przez Google lub GitHub, albo użyj e-maila i hasła. Po zalogowaniu przejdziesz
        do panelu (albo do adresu z parametru{" "}
        <code className="rounded bg-stone-100 px-1 text-xs">next</code>).
      </p>
      <LogowanieProwiderzy pochodzeniePubliczne={pochodzenie} nastepnaSciezka={nastepna} />
      <p className="mt-8 text-center text-sm text-stone-500">lub adres e-mail</p>
      <LogowanieFormularz
        nastepnaSciezka={nastepna}
        kodBledu={kodBledu}
        szczegolBledu={szczegolBledu}
      />
    </main>
  );
}
