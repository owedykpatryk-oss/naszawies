import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KartaBudynkuSwietlicy } from "@/components/swietlica/karta-budynku-swietlicy";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Świetlica (sołtys)",
};

export default async function SoltysSwietlicaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/swietlica");
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const nazwy: Record<string, string> = {};
  if (villageIds.length > 0) {
    const { data: wierszeWsi } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const w of wierszeWsi ?? []) {
      nazwy[w.id] = w.name ?? "Wieś";
    }
  }

  type WpisSali = {
    id: string;
    name: string;
    max_capacity: number | null;
    village_id: string;
    address: string | null;
    area_m2: number | null;
    parking_spaces: number | null;
    description: string | null;
  };
  let sale: WpisSali[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("halls")
      .select("id, name, max_capacity, village_id, address, area_m2, parking_spaces, description")
      .in("village_id", villageIds)
      .order("name", { ascending: true })
      .limit(80);
    sale = (data ?? []) as WpisSali[];
  }

  return (
    <PanelStronaSoltysa
      tytul="Świetlica i wyposażenie"
      opis={
        <>
          Dla każdej sali: <strong>profil budynku</strong>, rzut parteru, <strong>plan stołów z wymiarami</strong> i
          asortyment z planem WOW — mieszkańcy zobaczą to przy rezerwacji.
        </>
      }
      dzieci={
        <>
          {villageIds.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Nie masz aktywnej roli sołtysa ani współadministratora. Skontaktuj się z zespołem naszawies.pl w sprawie
              przypisania.
            </p>
          ) : null}

          <ul className="lista-wierszy-panelu space-y-4">
            {sale.map((h) => (
              <li key={h.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{nazwy[h.village_id] ?? "Wieś"}</p>
                <div className="mt-2">
                  <KartaBudynkuSwietlicy
                    nazwa={h.name}
                    adres={h.address}
                    areaM2={h.area_m2 != null ? Number(h.area_m2) : null}
                    maxCapacity={h.max_capacity}
                    parkingSpaces={h.parking_spaces != null ? Number(h.parking_spaces) : null}
                    opis={h.description}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/panel/soltys/swietlica/${h.id}#budynek-swietlicy`}
                    className="rounded-lg bg-green-800 px-3 py-2 text-sm font-medium text-white hover:bg-green-900"
                  >
                    Zarządzaj salą
                  </Link>
                  <Link
                    href={`/panel/soltys/swietlica/${h.id}#plan-sali-edytor`}
                    className="rounded-lg border border-green-800/40 px-3 py-2 text-sm text-green-900 hover:bg-green-50"
                  >
                    Plan stołów
                  </Link>
                  <Link
                    href={`/panel/soltys/swietlica/${h.id}#asortyment-swietlicy`}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 hover:bg-stone-50"
                  >
                    Asortyment
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {villageIds.length > 0 && sale.length === 0 ? (
            <p className="pusty-stan-panelu">Brak zdefiniowanych sal w serwisie dla Twojej wsi. Salę może dodać administrator platformy.</p>
          ) : null}

          <p className="mt-10 text-sm text-stone-500">
            <Link href="/panel/mieszkaniec/swietlica" className="text-green-800 underline">
              Widok mieszkańca (podgląd list sal)
            </Link>
          </p>
        </>
      }
    />
  );
}
