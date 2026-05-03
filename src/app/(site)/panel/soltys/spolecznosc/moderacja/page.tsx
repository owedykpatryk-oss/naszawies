import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoNaszawies } from "@/components/marka/logo-naszawies";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysModeracjaDyskusjiKlient, type RaportModeracji } from "./moderacja-klient";

export const metadata: Metadata = {
  title: "Moderacja społeczności (sołtys)",
  description: "Zgłoszenia mieszkańców i szybka moderacja dyskusji.",
};

export default async function SoltysModeracjaDyskusjiPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/spolecznosc/moderacja");
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <main>
        <h1 className="tytul-sekcji-panelu">Moderacja społeczności</h1>
        <p className="mt-2 text-sm text-stone-600">Nie masz przypisanej wsi w panelu sołtysa.</p>
      </main>
    );
  }

  const [{ data: wsieRows }, { data: raportyRows }] = await Promise.all([
    supabase.from("villages").select("id, name").in("id", villageIds).order("name"),
    supabase
      .from("village_content_reports")
      .select("id, village_id, content_type, content_id, reason, note, created_at")
      .in("village_id", villageIds)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const wsie = (wsieRows ?? []).map((w) => ({ id: w.id, name: w.name }));

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys/spolecznosc" className="text-green-800 underline">
          ← Społeczność i rozwój
        </Link>
      </p>
      <div className="mb-4">
        <LogoNaszawies kompakt />
      </div>
      <h1 className="tytul-sekcji-panelu">Moderacja społeczności</h1>
      <p className="mt-2 text-sm text-stone-600">
        Tu obsłużysz zgłoszenia mieszkańców dla dyskusji i bloga.
      </p>

      <div className="mt-6">
        <SoltysModeracjaDyskusjiKlient wsie={wsie} raporty={(raportyRows ?? []) as RaportModeracji[]} />
      </div>
    </main>
  );
}
