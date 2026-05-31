import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KartaBudynkuSwietlicy } from "@/components/swietlica/karta-budynku-swietlicy";
import { NaglowekModuluMieszkaniec } from "@/components/pomoc/naglowek-modulu-panelu";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";

export const metadata: Metadata = {
  title: "Świetlica (mieszkaniec)",
};

export default async function MieszkaniecSwietlicaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/mieszkaniec/swietlica");
  }

  const { data: aktywne } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("role", "mieszkaniec");

  const ids = (aktywne ?? []).map((r) => r.village_id).filter(Boolean);
  const nazwy = Object.fromEntries(
    (aktywne ?? []).map((r) => {
      const v = pojedynczaWies<{ name: string }>(r.villages);
      return [r.village_id, v?.name ?? "Wieś"];
    })
  );

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
  if (ids.length > 0) {
    const { data } = await supabase
      .from("halls")
      .select("id, name, max_capacity, village_id, address, area_m2, parking_spaces, description")
      .in("village_id", ids)
      .order("name", { ascending: true })
      .limit(50);
    sale = (data ?? []) as WpisSali[];
  }

  return (
    <main>
      <NaglowekModuluMieszkaniec
        tytul="Świetlica"
        opis="Sale w Twoich wsiach — adres, parking, rezerwacja i dokument wynajmu po wejściu w salę."
        hrefPomocy="/panel/mieszkaniec/pomoc"
      />

      {ids.length === 0 ? (
        <p className="pusty-stan-panelu mt-8">
          Potrzebujesz aktywnej roli mieszkańca.{" "}
          <Link href="/panel/mieszkaniec" className="font-medium underline">
            Wniosek
          </Link>
          .
        </p>
      ) : null}

      {ids.length > 0 && sale.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600">
          Brak zdefiniowanych sal w serwisie dla Twojej wsi — sołtys może poprosić administratora o dodanie.
        </p>
      ) : null}

      <ul className="mt-8 space-y-4">
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
                href={`/panel/mieszkaniec/swietlica/${h.id}`}
                className="rounded-lg bg-green-800 px-3 py-2 text-sm font-medium text-white hover:bg-green-900"
              >
                Rezerwacja i asortyment
              </Link>
              <Link
                href={`/panel/mieszkaniec/swietlica/${h.id}/dokument`}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 hover:bg-stone-50"
              >
                Dokument informacyjny
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
