import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KreatorGrafikiKlient } from "@/components/grafika/kreator-grafiki-klient";
import { SZABLONY_GRAFIKI } from "@/lib/grafika/szablony";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Kreator plakatów i zaproszeń",
  description:
    "Darmowe szablony zaproszeń, plakatów i dyplomów dla polskiej wsi — pobierz PDF bez konta. Po rejestracji: zapis, publikacja na profilu wsi.",
  openGraph: {
    title: "Kreator plakatów — naszawies.pl",
    description: "Gotowe szablony jak prosty Canva dla wsi. PDF od razu, konto odblokowuje więcej.",
  },
};

const NEXT_PO_REJESTRACJI = "/panel/mieszkaniec/grafika";

export default async function GrafikaPublicznaPage() {
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/panel/mieszkaniec/grafika");
    }
  } catch {
    /* brak env — demo dla gości */
  }

  const liczbaPublicznych = SZABLONY_GRAFIKI.filter((s) => s.dostep === "wszyscy").length;

  return (
    <main className="mx-auto min-w-0 max-w-6xl px-1 py-8 sm:py-12">
      <p className="text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-3xl tracking-tight text-green-950 sm:text-4xl">
        Kreator plakatów i zaproszeń
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
        Wypróbuj <strong>bez logowania</strong>: wybierz szablon, uzupełnij treść, pobierz PDF lub PNG na social.
        Dostępnych jest <strong>{liczbaPublicznych}</strong> projektów dla każdego — po założeniu konta odblokujesz
        pełną bibliotę ({SZABLONY_GRAFIKI.length}+) i zapis w chmurze.
      </p>

      <div className="mt-10">
        <KreatorGrafikiKlient
          kontekst={{ wies: "Twoja wieś", gmina: "" }}
          trybSoltys={false}
          trybKgw={false}
          trybOsp={false}
          zapisDoBazy={false}
          trybPubliczny
          nextPoRejestracji={NEXT_PO_REJESTRACJI}
        />
      </div>
    </main>
  );
}
