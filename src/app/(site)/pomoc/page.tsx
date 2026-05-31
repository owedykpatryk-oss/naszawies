import type { Metadata } from "next";
import Link from "next/link";
import { HeroModuluPublicznego } from "@/components/wspolne/hero-modulu-publicznego";
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
    <main className="page-shell py-8 sm:py-12">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="font-medium text-green-800 underline decoration-emerald-600/40 underline-offset-2">
          ← Strona główna
        </Link>
      </p>

      <HeroModuluPublicznego
        etykieta="Przewodniki krok po kroku"
        tytul="Centrum pomocy"
        opis={`Wybierz przewodnik dopasowany do roli: ${ETYKIETA_ROLI[rola]}. Wszystko krok po kroku — co, gdzie i w jakiej kolejności.`}
      />

      <div className="mt-8">
        <CentrumPomocyKlient rola={rola} pokazLinkSoltys={pokazLinkSoltys} />
      </div>
    </main>
  );
}
