import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelStronaMieszkaneca } from "@/components/panel/panel-strona-mieszkaneca";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { ProfilRynekFormularz } from "./profil-rynek-formularz";

export const metadata: Metadata = { title: "Profil firmy / sklepu — rynek" };

export default async function ProfilRynekMieszkaniecPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
            "village_id, profile_kind, business_name, short_description, details, phone, email, website, categories, service_area, is_verified",
          )
          .eq("owner_user_id", user.id)
          .in("village_id", villageIds)
          .maybeSingle()
      : { data: null };

  const profil = profilRaw
    ? {
        villageId: profilRaw.village_id,
        profile_kind:
          profilRaw.profile_kind === "sklep" ||
          profilRaw.profile_kind === "gospodarstwo" ||
          profilRaw.profile_kind === "uslugi"
            ? profilRaw.profile_kind
            : "firma",
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
    <PanelStronaMieszkaneca
      tytul="Twój sklep / firma na rynku"
      opis="Stała strona firmy z ofertami — mieszkańcy mogą ją obserwować i dostawać powiadomienia o nowych produktach. Weryfikację nadaje sołtys."
      hrefPowrotu="/panel/mieszkaniec/marketplace"
      etykietaPowrotu="← Rynek lokalny"
      wariantNaglowka="rynek"
      dzieci={<ProfilRynekFormularz wsie={wsie} profil={profil} />}
    />
  );
}
