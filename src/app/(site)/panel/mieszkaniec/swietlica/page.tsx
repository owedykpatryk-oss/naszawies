import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";

export const metadata: Metadata = {
  title: "Świetlica (mieszkaniec)",
};

export default async function MieszkaniecSwietlicaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  };
  let sale: WpisSali[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("halls")
      .select("id, name, max_capacity, village_id, address")
      .in("village_id", ids)
      .order("name", { ascending: true })
      .limit(50);
    sale = (data ?? []) as WpisSali[];
  }

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Świetlica</h1>
      <p className="mt-2 text-sm text-stone-600">
        Sale z katalogu <code className="rounded bg-stone-100 px-1 text-xs">halls</code> w Twoich wsiach (aktywny
        mieszkaniec). Rezerwacje i dokument wynajmu — po wejściu w wybraną salę poniżej.
      </p>

      {ids.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Potrzebujesz aktywnej roli mieszkańca.{" "}
          <Link href="/panel/mieszkaniec" className="font-medium underline">
            Wniosek
          </Link>
          .
        </p>
      ) : null}

      <ul className="mt-8 space-y-3">
        {sale.map((h) => (
          <li
            key={h.id}
            className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-stone-900">{h.name}</p>
              <p className="text-xs text-stone-600">
                {nazwy[h.village_id] ?? "Wieś"}
                {h.max_capacity ? ` · do ${h.max_capacity} osób` : ""}
                {h.address ? ` · ${h.address}` : ""}
              </p>
            </div>
            <Link
              href={`/panel/mieszkaniec/swietlica/${h.id}`}
              className="shrink-0 text-sm font-medium text-green-800 underline hover:text-green-950"
            >
              Zobacz salę i asortyment →
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
