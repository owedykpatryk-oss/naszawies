import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsModeracjiTresciCache } from "@/lib/panel/rola-moderacji";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysModeracjaDyskusjiKlient, type RaportModeracji } from "./moderacja-klient";

export const metadata: Metadata = {
  title: "Moderacja społeczności — rada sołecka",
  description: "Zgłoszenia mieszkańców i szybka moderacja dyskusji.",
};

export default async function SoltysModeracjaDyskusjiPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/spolecznosc/moderacja");
  }

  const villageIds = await pobierzVillageIdsModeracjiTresciCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Moderacja społeczności"
        opis="Nie masz uprawnień do moderacji treści w żadnej wsi. Sołtys nie moderuje dyskusji — to zadanie rady sołeckiej lub współadmina."
        powrotHref="/panel/soltys/spolecznosc"
        powrotEtykieta="← Społeczność i rozwój"
        dzieci={
          <Link href="/panel/rada" className="font-medium text-green-800 underline">
            Panel rady sołeckiej →
          </Link>
        }
      />
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
    <PanelStronaSoltysa
      tytul="Moderacja społeczności"
      opis="Tu obsłużysz zgłoszenia mieszkańców dla dyskusji i bloga."
      powrotHref="/panel/soltys/spolecznosc"
      powrotEtykieta="← Społeczność i rozwój"
      dzieci={<SoltysModeracjaDyskusjiKlient wsie={wsie} raporty={(raportyRows ?? []) as RaportModeracji[]} />}
    />
  );
}
