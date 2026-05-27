import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import type { PoiOpcja } from "./marketplace-formularz-rozszerzenia";
import { MarketplaceFormularzMieszkanca } from "./marketplace-formularz";
import { MarketplaceMojeLista, type MojeOgloszenieWiersz } from "./marketplace-moje-lista";
import { MarketplaceSubskrypcjeKlient, type SubskrypcjaWiersz } from "./marketplace-subskrypcje-klient";
import { MarketplaceSzablonKgwKlient } from "./marketplace-szablon-kgw-klient";

export const metadata: Metadata = { title: "Rynek lokalny — dodaj ogłoszenie" };

export default async function MarketplaceMieszkaniecPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
          .select("id, title, status, listing_type, created_at, expires_at, moderation_note")
          .eq("owner_user_id", user.id)
          .in("village_id", villageIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] };

  const [{ data: subRaw }, { data: poisRaw }] = await Promise.all([
    villageIds.length > 0
      ? supabase
          .from("marketplace_category_subscriptions")
          .select("id, village_id, equipment_category")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
    villageIds.length > 0
      ? supabase.from("pois").select("id, name, category, village_id").in("village_id", villageIds).limit(80)
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

  return (
    <main>
      <p className="text-sm text-stone-500">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl text-green-950">Rynek lokalny</h1>
      <p className="mt-2 text-sm text-stone-600">
        Darmowe ogłoszenia — miód, sery, mięso, warzywa, maszyny rolnicze, konie, wynajem z operatorem. Po zatwierdzeniu
        przez sołtysa na profilu wsi.
        Zainteresowani mogą napisać przez{" "}
        <Link href="/panel/czat" className="text-green-800 underline">
          Wiadomości
        </Link>
        .{" "}
        <Link href="/panel/mieszkaniec/profil-rynek" className="text-green-800 underline">
          Profil usługodawcy
        </Link>
      </p>
      <MarketplaceSubskrypcjeKlient wsie={wsie} subskrypcje={subskrypcje} />
      <MarketplaceSzablonKgwKlient wsie={wsie} />
      <MarketplaceMojeLista ogloszenia={(moje ?? []) as MojeOgloszenieWiersz[]} />
      <MarketplaceFormularzMieszkanca wsie={wsie} pois={pois} />
    </main>
  );
}
