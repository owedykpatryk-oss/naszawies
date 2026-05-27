import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { ProfilRynekFormularz } from "./profil-rynek-formularz";

export const metadata: Metadata = { title: "Profil usługodawcy — rynek" };

export default async function ProfilRynekMieszkaniecPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/mieszkaniec/profil-rynek");

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
  const { data: profilRaw } =
    villageIds.length > 0
      ? await supabase
          .from("marketplace_profiles")
          .select(
            "village_id, business_name, short_description, details, phone, email, website, categories, service_area, is_verified",
          )
          .eq("owner_user_id", user.id)
          .in("village_id", villageIds)
          .maybeSingle()
      : { data: null };

  const profil = profilRaw
    ? {
        villageId: profilRaw.village_id,
        business_name: profilRaw.business_name,
        short_description: profilRaw.short_description ?? "",
        details: profilRaw.details ?? "",
        phone: profilRaw.phone ?? "",
        email: profilRaw.email ?? "",
        website: profilRaw.website ?? "",
        categories_csv: (profilRaw.categories ?? []).join(", "),
        service_area: profilRaw.service_area ?? "",
        is_verified: profilRaw.is_verified,
      }
    : null;

  return (
    <main>
      <p className="text-sm text-stone-500">
        <Link href="/panel/mieszkaniec/marketplace" className="text-green-800 underline">
          ← Rynek lokalny
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl text-green-950">Profil usługodawcy</h1>
      <p className="mt-2 text-sm text-stone-600">
        Stała wizytówka na profilu wsi (obok pojedynczych ogłoszeń). Weryfikację może nadać sołtys.
      </p>
      <ProfilRynekFormularz wsie={wsie} profil={profil} />
    </main>
  );
}
