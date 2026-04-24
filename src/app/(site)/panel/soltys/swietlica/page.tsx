import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

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
        Dla każdej sali ustawiasz m.in. <strong>plan układu stołów</strong> (rysunek w panelu) oraz listę wyposażenia
        — mieszkańcy zobaczą to przy rezerwacji. Nie trzeba zgłaszać tego do administratora: robisz to sam w
        zakładce sali.
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
              href={`/panel/soltys/swietlica/${h.id}#plan-sali-edytor`}
              className="shrink-0 rounded-lg bg-green-800 px-3 py-2 text-center text-sm font-medium text-white hover:bg-green-900"
            >
              Otwórz salę
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
