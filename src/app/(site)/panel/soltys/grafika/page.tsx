import type { Metadata } from "next";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { KreatorGrafikiKlient } from "@/components/grafika/kreator-grafiki-klient";
import { SZABLONY_GRAFIKI } from "@/lib/grafika/szablony";
import type { ProfilWsiGrafiki } from "@/lib/grafika/typy";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";

export const metadata: Metadata = {
  title: "Kreator grafiki",
  description: "Zaproszenia, dyplomy, plakaty i podziękowania — jak prosty Canva dla polskiej wsi.",
};

export default async function SoltysGrafikaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  let domyslnaWies = "";
  let domyslnaGmina = "";
  let villageId: string | null = null;
  let sciezkaWsi = "";
  let profilWsi: ProfilWsiGrafiki | null = null;
  let telefonSoltysa = "";
  let emailSoltysa = "";

  if (villageIds.length > 0) {
    villageId = villageIds[0];
    const { data: v } = await supabase
      .from("villages")
      .select("name, commune, voivodeship, county, slug, cover_image_url")
      .eq("id", villageIds[0])
      .maybeSingle();
    if (v) {
      domyslnaWies = v.name ?? "";
      domyslnaGmina = v.commune ?? "";
      sciezkaWsi = sciezkaProfiluWsi({
        voivodeship: v.voivodeship,
        county: v.county,
        commune: v.commune,
        slug: v.slug,
      });
      profilWsi = {
        zdjecieTloUrl: v.cover_image_url,
      };
    }

    const { data: kontaktSoltys } = await supabase
      .from("village_official_contacts")
      .select("contact_phone, contact_email")
      .eq("village_id", villageIds[0])
      .eq("office_key", "soltys")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (kontaktSoltys) {
      telefonSoltysa = kontaktSoltys.contact_phone?.trim() ?? "";
      emailSoltysa = kontaktSoltys.contact_email?.trim() ?? "";
      profilWsi = {
        ...profilWsi,
        telefon: telefonSoltysa || null,
        email: emailSoltysa || null,
      };
    }
  }

  const { data: profilUzytkownika } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const organizator = profilUzytkownika?.display_name?.trim()
    ? `Sołtys ${profilUzytkownika.display_name.trim()}`
    : "";

  return (
    <PanelStronaSoltysa
      tytul="Kreator grafiki"
      opis={
        <>
          Zaproszenia, plakaty i dyplomy w <strong>3 zakładkach</strong> (szablon → treść → pobierz). PDF, social,
          publikacja na profilu wsi, ogłoszenia, kalendarz i tablica cyfrowa świetlicy. Łącznie{" "}
          {SZABLONY_GRAFIKI.length} gotowych projektów.
        </>
      }
      szeroki
      dzieci={
        <KreatorGrafikiKlient
          kontekst={{
            wies: domyslnaWies,
            gmina: domyslnaGmina,
            organizator,
            telefon: telefonSoltysa || undefined,
            email: emailSoltysa || undefined,
          }}
          villageId={villageId}
          trybSoltys={villageIds.length > 0}
          trybKgw
          trybOsp
          zapisDoBazy={villageIds.length > 0}
          sciezkaWsi={sciezkaWsi}
          profilWsi={profilWsi}
        />
      }
    />
  );
}
