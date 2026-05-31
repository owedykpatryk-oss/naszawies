import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NaglowekModuluMieszkaniec } from "@/components/pomoc/naglowek-modulu-panelu";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import type { PoiOpcja } from "./marketplace-formularz-rozszerzenia";
import { MarketplaceFormularzMieszkanca, type MetaWsiFormularz } from "./marketplace-formularz";
import { MarketplaceMojeLista, type MojeOgloszenieWiersz } from "./marketplace-moje-lista";
import { MarketplaceSubskrypcjeKlient, type SubskrypcjaWiersz } from "./marketplace-subskrypcje-klient";
import { MarketplaceSzablonKgwKlient } from "./marketplace-szablon-kgw-klient";

export const metadata: Metadata = { title: "Rynek lokalny — dodaj ogłoszenie" };

export default async function MarketplaceMieszkaniecPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/logowanie?next=/panel/mieszkaniec/marketplace");

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const wsie = (roleRows ?? [])
    .map((r) => {
      const v = pojedynczaWies<{ name: string }>(r.villages);
      return v ? { id: r.village_id, name: v.name } : null;
    })
    .filter((x): x is { id: string; name: string } => x != null);

  const villageIds = wsie.map((w) => w.id);
  const { data: moje } =
    villageIds.length > 0
      ? await supabase
          .from("marketplace_listings")
          .select(
            "id, title, status, listing_type, created_at, expires_at, moderation_note, village_id, image_urls, villages(voivodeship, county, commune, slug)",
          )
          .eq("owner_user_id", user.id)
          .in("village_id", villageIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] };

  const [{ data: subRaw }, { data: poisRaw }, { data: wiesGeoRaw }] = await Promise.all([
    villageIds.length > 0
      ? supabase
          .from("marketplace_category_subscriptions")
          .select("id, village_id, equipment_category")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
    villageIds.length > 0
      ? supabase.from("pois").select("id, name, category, village_id").in("village_id", villageIds).limit(80)
      : Promise.resolve({ data: [] }),
    villageIds.length > 0
      ? supabase
          .from("villages")
          .select("id, latitude, longitude, boundary_geojson")
          .in("id", villageIds)
      : Promise.resolve({ data: [] }),
  ]);

  const nazwyWsi = Object.fromEntries(wsie.map((w) => [w.id, w.name]));
  const subskrypcje: SubskrypcjaWiersz[] = (subRaw ?? []).map((s) => ({
    id: s.id,
    village_id: s.village_id,
    equipment_category: s.equipment_category,
    nazwaWsi: nazwyWsi[s.village_id] ?? "—",
  }));
  const pois: PoiOpcja[] = (poisRaw ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    village_id: p.village_id,
  }));

  const metaWsi: Record<string, MetaWsiFormularz> = Object.fromEntries(
    (wiesGeoRaw ?? []).map((v) => [
      v.id,
      {
        latitude: v.latitude != null ? Number(v.latitude) : null,
        longitude: v.longitude != null ? Number(v.longitude) : null,
        boundaryGeojson: v.boundary_geojson,
      },
    ]),
  );

  const mojeOgloszenia: MojeOgloszenieWiersz[] = (moje ?? []).map((o) => {
    const v = pojedynczaWies<{ voivodeship: string; county: string; commune: string; slug: string }>(o.villages);
    const hrefPubliczny = v ? `${sciezkaProfiluWsi(v)}/rynek/${o.id}` : null;
    return {
      id: o.id,
      title: o.title,
      status: o.status,
      listing_type: o.listing_type,
      created_at: o.created_at,
      expires_at: o.expires_at,
      moderation_note: o.moderation_note,
      image_url: o.image_urls?.[0] ?? null,
      hrefPubliczny,
    };
  });

  return (
    <main>
      <NaglowekModuluMieszkaniec
        wariant="rynek"
        etykieta="Rynek lokalny"
        tytul="Dodaj ogłoszenie"
        opis={
          <>
            Darmowe ogłoszenia — produkty z gospodarstwa, maszyny, konie oraz{" "}
            <strong>działki i domy z mapą z Geoportalu</strong> (do 5 zdjęć). Zainteresowani piszą przez{" "}
            <Link href="/panel/czat" className="font-medium text-green-800 underline">
              Wiadomości
            </Link>
            .{" "}
            <Link href="/panel/mieszkaniec/profil-rynek" className="font-medium text-green-800 underline">
              Profil usługodawcy
            </Link>
          </>
        }
      />
      <MarketplaceSubskrypcjeKlient wsie={wsie} subskrypcje={subskrypcje} />
      <MarketplaceSzablonKgwKlient wsie={wsie} />
      <MarketplaceMojeLista ogloszenia={mojeOgloszenia} />
      <MarketplaceFormularzMieszkanca wsie={wsie} metaWsi={metaWsi} pois={pois} />
    </main>
  );
}
