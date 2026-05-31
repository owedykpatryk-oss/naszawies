import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { normalizujKategorieLinku } from "@/lib/wies/linki-przydatne";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { InformacjeLokalneKlient, type LinkDoEdycji, type WiesDoInformacji } from "./informacje-lokalne-klient";

export const metadata: Metadata = {
  title: "Informacje dla mieszkańców",
};

export default async function InformacjeLokalnePage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/informacje-lokalne");
  }
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Informacje dla mieszkańców"
        opis="Brak przypisanej wsi w roli sołtysa lub współadmina."
        dzieci={null}
      />
    );
  }

  const { data: rows } = await supabase
    .from("villages")
    .select("id, name, commune, voivodeship, county, slug")
    .in("id", villageIds)
    .order("name");
  const wsie: WiesDoInformacji[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    commune: r.commune,
    profilPubliczny: sciezkaProfiluWsi({
      voivodeship: r.voivodeship,
      county: r.county,
      commune: r.commune,
      slug: r.slug,
    }),
  }));

  const { data: linkRows } = await supabase
    .from("village_useful_links")
    .select("id, village_id, category, title, url, phone, email, note, display_order, is_active")
    .in("village_id", villageIds)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  const linki: LinkDoEdycji[] = (linkRows ?? []).map((r) => ({
    id: r.id,
    village_id: r.village_id,
    category: normalizujKategorieLinku(r.category),
    title: r.title,
    url: r.url,
    phone: r.phone,
    email: r.email,
    note: r.note,
    display_order: r.display_order,
    is_active: r.is_active,
  }));

  return (
    <PanelStronaSoltysa
      tytul="Informacje dla mieszkańców"
      opis={
        <>
          Dodaj linki do BIP gminy, urzędu, lokalnej gazety, radia i portali — oraz numery telefonów. Pojawią się na
          profilu wsi w sekcji „Informacje dla mieszkańców”. Dłuższe opisy (śmieci, drogi) uzupełnij w{" "}
          <Link href="/panel/soltys/samorzad" className="font-medium text-green-800 underline">
            przewodniku samorządowym
          </Link>
          .
        </>
      }
      dzieci={<InformacjeLokalneKlient wsie={wsie} linki={linki} />}
    />
  );
}
