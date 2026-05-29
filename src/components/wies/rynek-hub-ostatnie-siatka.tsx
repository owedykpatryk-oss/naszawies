import { KartaOgloszeniaRynek } from "@/components/wies/rynek-ui";
import type { OstatnieOgloszenieHub } from "@/lib/marketplace/pobierz-hub-rynku";

export function RynekHubOstatnieSiatka({ ostatnie }: { ostatnie: OstatnieOgloszenieHub[] }) {
  if (ostatnie.length === 0) return null;

  return (
    <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ostatnie.map((o) => (
        <li key={o.id} className="flex flex-col">
          <KartaOgloszeniaRynek
            oferta={{
              id: o.id,
              title: o.title,
              listing_type: o.listing_type,
              category: o.category,
              equipment_category: o.equipment_category,
              location_text: `${o.nazwaWsi} · ${o.gmina}`,
              price_amount: o.price_amount,
              price_unit: o.price_unit,
              currency: o.currency,
              image_urls: o.image_urls,
              published_at: o.published_at,
              created_at: o.published_at ?? new Date(0).toISOString(),
              seller_verified: o.seller_verified,
              parcel_area_m2: o.parcel_area_m2,
              parcel_number: o.parcel_number,
              geoportal_parcel_id: o.geoportal_parcel_id,
              view_count: o.view_count,
            }}
            href={o.sciezka}
            uklad="siatka"
          />
          <p className="mt-1.5 text-center text-[11px] text-stone-500">
            <a href={o.sciezkaWsiRynek} className="font-medium text-green-800 underline">
              Rynek — {o.nazwaWsi}
            </a>
          </p>
        </li>
      ))}
    </ul>
  );
}
