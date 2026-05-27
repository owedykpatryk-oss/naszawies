import type { Metadata } from "next";
import Link from "next/link";
import { CentrumPomocyKlient } from "@/components/pomoc/centrum-pomocy-klient";
import { ETYKIETA_ROLI, type RolaPrzewodnika } from "@/lib/pomoc/przewodniki";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Centrum pomocy",
  description: "Przewodniki: mieszkańiec, sołtys, KGW, OSP, myśliwi — jak korzystać z naszawies.pl.",
};

type Props = { searchParams?: { rola?: string } };

function rolaZParam(rola?: string): RolaPrzewodnika {
  const dozwolone: RolaPrzewodnika[] = ["ogolne", "mieszkaniec", "soltys", "kgw", "osp", "mysliwi"];
  if (rola && dozwolone.includes(rola as RolaPrzewodnika)) return rola as RolaPrzewodnika;
  return "ogolne";
}

export default async function PomocPage({ searchParams }: Props) {
  const rola = rolaZParam(searchParams?.rola);
  let pokazLinkSoltys = false;
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
      pokazLinkSoltys = ids.length > 0;
    }
  } catch {
    /* ignore */
  }

  return (
    <main className="page-shell py-10 sm:py-14">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Centrum pomocy</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Wybierz przewodnik dopasowany do roli: {ETYKIETA_ROLI[rola]}. Wszystko krok po kroku — co, gdzie i w jakiej kolejności.
      </p>
      <div className="mt-8">
        <CentrumPomocyKlient rola={rola} pokazLinkSoltys={pokazLinkSoltys} />
      </div>
    </main>
  );
}
