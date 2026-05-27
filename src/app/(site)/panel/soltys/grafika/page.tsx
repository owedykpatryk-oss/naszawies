import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KreatorGrafikiKlient } from "@/components/grafika/kreator-grafiki-klient";
import { SZABLONY_GRAFIKI } from "@/lib/grafika/szablony";
import type { ProfilWsiGrafiki } from "@/lib/grafika/typy";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Kreator grafiki",
  description: "Zaproszenia, dyplomy, plakaty i podziękowania — jak prosty Canva dla polskiej wsi.",
};

export default async function SoltysGrafikaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/grafika");
  }

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
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Kreator grafiki</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        Zaproszenia, plakaty i dyplomy w <strong>3 zakładkach</strong> (szablon → treść → pobierz). PDF, social,
        publikacja na profilu wsi, ogłoszenia, kalendarz i tablica cyfrowa świetlicy. Łącznie{" "}
        {SZABLONY_GRAFIKI.length} gotowych projektów.
      </p>

      <div className="mt-10">
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
      </div>
    </main>
  );
}
