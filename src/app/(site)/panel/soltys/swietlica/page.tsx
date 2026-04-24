import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";

export const metadata: Metadata = {
  title: "Świetlica (sołtys)",
};

export default async function SoltysSwietlicaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/swietlica");
  }

  const { data: mojeWsi } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);

  const wiersze = (mojeWsi ?? []) as {
    village_id: string;
    villages: unknown;
  }[];
  const villageIds = wiersze.map((r) => r.village_id).filter(Boolean);
  const nazwy: Record<string, string> = {};
  for (const r of wiersze) {
    const v = pojedynczaWies<{ name: string }>(r.villages);
    nazwy[r.village_id] = v?.name ?? "Wieś";
  }

  type WpisSali = {
    id: string;
    name: string;
    max_capacity: number | null;
    village_id: string;
    address: string | null;
  };
  let sale: WpisSali[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("halls")
      .select("id, name, max_capacity, village_id, address")
      .in("village_id", villageIds)
      .order("name", { ascending: true })
      .limit(80);
    sale = (data ?? []) as WpisSali[];
  }

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Świetlica i wyposażenie</h1>
      <p className="mt-2 text-sm text-stone-600">
        Sale w Twoich sołectwach. Dla każdej sali możesz prowadzić listę sprzętu i rzeczy (magazyn,
        piwnica, meble) — mieszkańcy zobaczą ją przy rezerwacji świetlicy.
      </p>

      {villageIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie masz aktywnej roli sołtysa ani współadministratora. Skontaktuj się z zespołem
          naszawies.pl w sprawie przypisania.
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
              href={`/panel/soltys/swietlica/${h.id}`}
              className="shrink-0 rounded-lg bg-green-800 px-3 py-2 text-center text-sm font-medium text-white hover:bg-green-900"
            >
              Asortyment i szczegóły
            </Link>
          </li>
        ))}
      </ul>

      {villageIds.length > 0 && sale.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600">
          Brak zdefiniowanych sal w bazie dla Twojej wsi. Sala może zostać dodana przez
          administratora platformy lub migrację danych.
        </p>
      ) : null}

      <p className="mt-10 text-sm text-stone-500">
        <Link href="/panel/mieszkaniec/swietlica" className="text-green-800 underline">
          Widok mieszkańca (podgląd list sal)
        </Link>
      </p>
    </main>
  );
}
