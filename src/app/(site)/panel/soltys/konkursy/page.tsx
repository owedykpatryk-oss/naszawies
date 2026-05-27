import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { KonkursySoltysKlient, type WierszKonkursuSoltys } from "./konkursy-soltys-klient";
import type { StatusKonkursuFoto } from "@/lib/konkurs-foto/fazy-konkursu";

export const metadata: Metadata = {
  title: "Konkursy zdjęć",
};

export default async function SoltysKonkursyPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/soltys/konkursy");

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const wsie: { id: string; name: string }[] = [];
  const nazwy: Record<string, string> = {};
  if (villageIds.length > 0) {
    const { data: vs } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const v of vs ?? []) {
      wsie.push({ id: v.id, name: v.name });
      nazwy[v.id] = v.name;
    }
  }

  const konkursy: WierszKonkursuSoltys[] = [];
  if (villageIds.length > 0) {
    const { data: rows } = await supabase
      .from("village_photo_contests")
      .select(
        "id, village_id, title, status, submissions_start, submissions_end, voting_start, voting_end, max_entries_per_user, winner_photo_id",
      )
      .in("village_id", villageIds)
      .order("created_at", { ascending: false });

    for (const r of rows ?? []) {
      const [{ count: wszystkie }, { count: zatw }] = await Promise.all([
        supabase
          .from("photos")
          .select("id", { count: "exact", head: true })
          .eq("contest_id", r.id),
        supabase
          .from("photos")
          .select("id", { count: "exact", head: true })
          .eq("contest_id", r.id)
          .eq("status", "approved"),
      ]);
      konkursy.push({
        id: r.id,
        villageId: r.village_id,
        wiesNazwa: nazwy[r.village_id] ?? "Wieś",
        title: r.title,
        status: r.status as StatusKonkursuFoto,
        submissionsStart: r.submissions_start,
        submissionsEnd: r.submissions_end,
        votingStart: r.voting_start,
        votingEnd: r.voting_end,
        maxEntriesPerUser: r.max_entries_per_user,
        liczbaZgloszen: wszystkie ?? 0,
        liczbaZatwierdzonych: zatw ?? 0,
        winnerPhotoId: r.winner_photo_id,
      });
    }
  }

  return (
    <PanelStronaSoltysa
      tytul="Konkursy zdjęć"
      opis="Zorganizuj plebiscyt na najlepsze zdjęcie wsi. Mieszkańcy zgłaszają w fotokronice, Ty moderujesz, potem społeczność głosuje na profilu publicznym."
      akcje={
        <Link href="/panel/soltys/fotokronika" className="btn-panel-secondary text-sm">
          Fotokronika
        </Link>
      }
      dzieci={<KonkursySoltysKlient wsie={wsie} konkursy={konkursy} />}
    />
  );
}
