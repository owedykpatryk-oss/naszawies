import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelStronaMieszkaneca } from "@/components/panel/panel-strona-mieszkaneca";
import { roleDlaUprawnienia } from "@/lib/panel/uprawnienia-wsi";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { FormularzCenRolniczych } from "./formularz-cen-rolniczych";

export const metadata: Metadata = {
  title: "Ceny skupu — zgłoszenia",
};

export default async function RolnictwoCenyPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/logowanie?next=/panel/mieszkaniec/rolnictwo-ceny");

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, villages ( id, name )")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [...roleDlaUprawnienia("dostep_podstawowy")]);

  const wioski = (roleRows ?? [])
    .map((r) => {
      const v = Array.isArray(r.villages) ? r.villages[0] : r.villages;
      return v ? { id: v.id as string, name: v.name as string } : null;
    })
    .filter(Boolean) as { id: string; name: string }[];

  if (wioski.length === 0) {
    return (
      <PanelStronaMieszkaneca
        tytul="Ceny skupu"
        opis="Do zgłaszania cen potrzebujesz roli mieszkańca we wsi."
        dzieci={null}
      />
    );
  }

  const villageIds = wioski.map((w) => w.id);
  const { data: raporty } = await supabase
    .from("agri_ceny_lokalne")
    .select("id, village_id, product_key, price_value, price_unit, place_name, confirmation_count, reported_by")
    .in("village_id", villageIds)
    .order("observed_at", { ascending: false })
    .limit(30);

  const doPotwierdzenia = (raporty ?? []).filter((r) => r.reported_by !== user.id);

  return (
    <PanelStronaMieszkaneca
      tytul="Ceny skupu — społeczność"
      opis="Zgłoś cenę z własnej transakcji. Inni mieszkańcy mogą ją potwierdzić — bez udziału sołtysa."
      dzieci={<FormularzCenRolniczych wioski={wioski} raporty={doPotwierdzenia} userId={user.id} />}
    />
  );
}
