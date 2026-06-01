import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import type { RynekOfertaPubliczna } from "@/components/wies/marketplace-lista-klient";
import { MarketplaceListaKlient } from "@/components/wies/marketplace-lista-klient";
import { wzbogacOfertyOZaufanie } from "@/lib/marketplace/zaufanie-sprzedawcy";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type Props = { params: { villageId: string } };

const POLE_SELECT_RYNEK =
  "id, title, listing_type, category, equipment_category, location_text, price_amount, price_unit, currency, with_operator, image_urls, published_at, created_at, seller_verified, parcel_area_m2, parcel_number, geoportal_parcel_id, view_count, owner_user_id";

export const revalidate = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase.from("villages").select("name").eq("id", params.villageId).maybeSingle();
  return {
    title: data?.name ? `Rynek lokalny — ${data.name}` : "Rynek lokalny",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedRynekWsiPage({ params }: Props) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug, is_active")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies?.is_active) notFound();

  const { data: ofertyRaw } = await supabase
    .from("marketplace_listings")
    .select(POLE_SELECT_RYNEK)
    .eq("village_id", wies.id)
    .eq("status", "approved")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(24);

  const oferty = wzbogacOfertyOZaufanie((ofertyRaw ?? []) as RynekOfertaPubliczna[]);
  const sciezka = sciezkaProfiluWsi(wies);

  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-orange-200/70 bg-white p-4 shadow-sm">
      <header className="border-b border-orange-100 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">Rynek lokalny</p>
        <h1 className="font-serif text-xl text-green-950">{wies.name}</h1>
        <p className="mt-1 text-xs text-stone-600">Ogłoszenia sąsiadów — aktualizowane na bieżąco.</p>
      </header>

      <div className="mt-4">
        {oferty.length === 0 ? (
          <p className="text-sm text-stone-600">Brak aktywnych ogłoszeń na rynku tej wsi.</p>
        ) : (
          <MarketplaceListaKlient
            oferty={oferty}
            sciezkaWsi={sciezka}
            villageId={wies.id}
            nazwaWsi={wies.name}
            tryb="skrot"
            pokazLinkWszystkie={false}
            limitWyswietlania={12}
            ukryjPasekAkcji
            zalogowany={false}
          />
        )}
      </div>
    </article>
  );
}
