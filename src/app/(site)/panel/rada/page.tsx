import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsModeracjiTresci } from "@/lib/panel/rola-moderacji";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Panel rady sołeckiej — moderacja",
};

export default async function RadaPanelPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/rada");

  const villageIds = await pobierzVillageIdsModeracjiTresci(supabase, user.id);
  if (villageIds.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-900">Rada sołecka</h1>
        <p className="mt-3 text-stone-600">
          Nie masz roli rady sołeckiej ani współadmina w żadnej wsi. Sołtys nie moderuje tu ogłoszeń —
          to zadanie rady.
        </p>
        <Link href="/panel/mieszkaniec" className="mt-4 inline-block text-emerald-800 underline">
          Wróć do panelu mieszkańca
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900">Moderacja treści — rada sołecka</h1>
      <p className="mt-2 text-sm text-stone-600">
        Akceptacja ogłoszeń, rynku, fotokroniki i raportów społeczności. Sołtys zajmuje się wyłącznie
        sprawami sołeckimi (wnioski, rezerwacje, zgłoszenia, profil wsi).
      </p>
      <ul className="mt-6 space-y-3">
        <li>
          <Link href="/panel/soltys" className="font-medium text-emerald-900 underline-offset-2 hover:underline">
            Kolejka moderacji (posty, rynek, pomoc)
          </Link>
        </li>
        <li>
          <Link
            href="/panel/soltys/spolecznosc/moderacja"
            className="font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            Raporty treści i dyskusje
          </Link>
        </li>
        <li>
          <Link
            href="/panel/soltys/wiadomosci-lokalne"
            className="font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            Wiadomości lokalne do zatwierdzenia
          </Link>
        </li>
        <li>
          <Link
            href="/panel/soltys/fotokronika"
            className="font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            Fotokronika — zdjęcia oczekujące
          </Link>
        </li>
      </ul>
    </main>
  );
}
