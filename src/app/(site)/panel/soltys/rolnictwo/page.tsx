import type { Metadata } from "next";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { SoltysRolnictwoKlient, type ProfilRolnictwaWiersz } from "./soltys-rolnictwo-klient";

export const metadata: Metadata = {
  title: "Rolnictwo",
};

export default async function SoltysRolnictwoPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  const wsie: { id: string; name: string }[] = [];
  const sciezkiPubliczne: Record<string, string> = {};
  let profile: ProfilRolnictwaWiersz[] = [];

  if (villageIds.length > 0) {
    const [{ data: vs }, { data: profiles }] = await Promise.all([
      supabase.from("villages").select("id, name, voivodeship, county, commune, slug").in("id", villageIds),
      supabase.from("village_agriculture_profiles").select("village_id, profile_data, is_published").in("village_id", villageIds),
    ]);
    for (const v of vs ?? []) {
      wsie.push({ id: v.id, name: v.name });
      if (v.voivodeship && v.county && v.commune && v.slug) {
        sciezkiPubliczne[v.id] = sciezkaProfiluWsi({
          voivodeship: v.voivodeship,
          county: v.county,
          commune: v.commune,
          slug: v.slug,
        });
      }
    }
    profile = (profiles ?? []).map((p) => ({
      villageId: p.village_id as string,
      profileData: p.profile_data,
      isPublished: p.is_published,
    }));
  }

  return (
    <PanelStronaSoltysa
      tytul="Rolnictwo"
      opis="Profil rolniczy wsi: ARiMR, dopłaty, skup, ostrzeżenia sezonowe — uzupełnia sekcję z cenami GUS na profilu publicznym."
      akcje={
        <>
          <a href="/panel/soltys/spolecznosc?tryb=rolnicy" className="btn-panel-secondary text-sm">
            Koło rolników
          </a>
          <a href="/panel/soltys/lesnictwo" className="btn-panel-secondary text-sm">
            Leśnictwo
          </a>
        </>
      }
      dzieci={<SoltysRolnictwoKlient wsie={wsie} profile={profile} sciezkiPubliczne={sciezkiPubliczne} />}
    />
  );
}
