import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { LogowanieProwiderzy } from "../logowanie/logowanie-prowiderzy";
import { RejestracjaFormularz } from "./rejestracja-formularz";
import { LogoNaszawiesWycentrowane } from "@/components/marka/logo-naszawies";
import { pobierzWiesPoIdDlaRejestracji } from "./akcje-katalog-wsi";

export const metadata: Metadata = {
  title: "Rejestracja",
  description: "Załóż konto na naszawies.pl — dołącz do swojej wsi za darmo.",
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function RejestracjaPage({ searchParams }: Props) {
  const pochodzenie = pobierzPochodzeniePubliczne();
  const nastepnyParam = searchParams.next;
  const nastepna =
    typeof nastepnyParam === "string" ? bezpiecznaSciezkaNastepna(nastepnyParam) : "/panel";

  const wiesParam = searchParams.wies;
  const wiesId = typeof wiesParam === "string" ? wiesParam.trim() : "";
  const intencjaParam = searchParams.intencja;
  const intencjaRaw = typeof intencjaParam === "string" ? intencjaParam.trim() : "";
  const domyslnaIntencja =
    intencjaRaw === "mieszkaniec" || intencjaRaw === "soltys" ? intencjaRaw : undefined;

  const wiesPrefill = wiesId ? await pobierzWiesPoIdDlaRejestracji(wiesId) : null;

  try {
    const user = await pobierzUzytkownikaSerwer();
    if (user) {
      redirect(nastepna);
    }
  } catch {
    // brak env — strona dalej pokaże formularz
  }

  return (
    <main className="mx-auto min-w-0 max-w-md py-12 text-stone-800 sm:py-16">
      <LogoNaszawiesWycentrowane />
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm ring-1 ring-stone-900/[0.04] sm:p-8">
      <h1 className="font-serif text-3xl text-green-950">Rejestracja</h1>
      {wiesPrefill ? (
        <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Dołączasz do wsi <strong>{wiesPrefill.nazwa}</strong> — po potwierdzeniu e-maila wniosek trafi do sołtysa
          automatycznie.
        </p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          <strong>To samo konto</strong> dla każdego: mieszkaniec, sołtys i inne role to osobny krok{" "}
          <em>po</em> założeniu konta (wniosek do wsi, akceptacja sołtysa, ewentualnie zespół
          naszawies.pl przy roli sołtysa). Tutaj tylko zakładasz logowanie — bez wyboru „jestem
          sołtysem” w sensie prawnym.
        </p>
      )}
      <LogowanieProwiderzy pochodzeniePubliczne={pochodzenie} nastepnaSciezka={nastepna} />
      <p className="mt-8 text-center text-sm text-stone-500">lub zarejestruj się e-mailem</p>
      <RejestracjaFormularz
        nastepnaSciezka={nastepna}
        domyslnaIntencja={domyslnaIntencja ?? (wiesPrefill ? "mieszkaniec" : undefined)}
        domyslnaWies={wiesPrefill}
      />
      </div>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          Strona główna
        </Link>
        {" · "}
        <Link href="/szukaj" className="text-green-800 underline">
          Szukaj wsi
        </Link>
      </p>
    </main>
  );
}
