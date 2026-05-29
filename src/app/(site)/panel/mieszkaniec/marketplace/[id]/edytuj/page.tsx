import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import type { PoiOpcja } from "../../marketplace-formularz-rozszerzenia";
import { MarketplaceFormularzMieszkanca, type MetaWsiFormularz } from "../../marketplace-formularz";
import type { WartosciDzialkiRynek } from "@/components/marketplace/marketplace-formularz-dzialka";
import type { GeoJsonGeometriiDzialki } from "@/lib/geoportal/wkt-do-geojson";

export const metadata: Metadata = { title: "Edytuj ogłoszenie — rynek lokalny" };

type Props = { params: { id: string } };

export default async function EdytujOgloszenieMarketplacePage({ params }: Props) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=/panel/mieszkaniec/marketplace/${params.id}/edytuj`);

  const { data: ogl } = await supabase
    .from("marketplace_listings")
    .select(
      "id, village_id, owner_user_id, listing_type, title, description, equipment_category, price_amount, price_unit, with_operator, phone, location_text, image_urls, status, latitude, longitude, pickup_in_village, delivery_radius_km, seasonal_note, product_produced_at, product_best_before, is_organic, allergens_text, sales_poi_id, parcel_geojson, parcel_number, cadastral_district, parcel_area_m2, geoportal_parcel_id",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!ogl || ogl.owner_user_id !== user.id) notFound();
  if (!["pending", "approved", "rejected"].includes(ogl.status)) notFound();

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
  const [{ data: poisRaw }, { data: wiesGeoRaw }] = await Promise.all([
    supabase.from("pois").select("id, name, category, village_id").eq("village_id", ogl.village_id).limit(40),
    villageIds.length > 0
      ? supabase.from("villages").select("id, latitude, longitude, boundary_geojson").in("id", villageIds)
      : Promise.resolve({ data: [] }),
  ]);

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

  const dzialka: WartosciDzialkiRynek = {
    parcelGeojson: (ogl.parcel_geojson as GeoJsonGeometriiDzialki | null) ?? null,
    parcelNumber: ogl.parcel_number ?? "",
    cadastralDistrict: ogl.cadastral_district ?? "",
    parcelAreaM2: ogl.parcel_area_m2 != null ? Number(ogl.parcel_area_m2) : null,
    geoportalParcelId: ogl.geoportal_parcel_id ?? "",
  };

  return (
    <main>
      <p className="text-sm text-stone-500">
        <Link href="/panel/mieszkaniec/marketplace" className="text-green-800 underline">
          ← Rynek lokalny
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl text-green-950">Edytuj ogłoszenie</h1>
      <p className="mt-2 text-sm text-stone-600">{ogl.title}</p>
      <MarketplaceFormularzMieszkanca
        wsie={wsie}
        metaWsi={metaWsi}
        pois={pois}
        edycja={{
          id: ogl.id,
          villageId: ogl.village_id,
          listingType: ogl.listing_type,
          title: ogl.title,
          description: ogl.description,
          equipmentCategory: ogl.equipment_category,
          priceAmount: ogl.price_amount,
          priceUnit: ogl.price_unit,
          withOperator: ogl.with_operator,
          phone: ogl.phone,
          locationText: ogl.location_text,
          imageUrls: ogl.image_urls ?? [],
          rozszerzone: {
            latitude: ogl.latitude,
            longitude: ogl.longitude,
            pickupInVillage: ogl.pickup_in_village ?? false,
            deliveryRadiusKm: ogl.delivery_radius_km != null ? Number(ogl.delivery_radius_km) : null,
            seasonalNote: ogl.seasonal_note ?? "",
            productProducedAt: ogl.product_produced_at ?? "",
            productBestBefore: ogl.product_best_before ?? "",
            isOrganic: ogl.is_organic ?? false,
            allergensText: ogl.allergens_text ?? "",
            salesPoiId: ogl.sales_poi_id,
          },
          dzialka,
        }}
      />
    </main>
  );
}
