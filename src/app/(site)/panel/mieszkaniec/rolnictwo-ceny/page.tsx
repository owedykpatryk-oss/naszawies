import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { roleDlaUprawnienia } from "@/lib/panel/uprawnienia-wsi";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { FormularzCenRolniczych } from "./formularz-cen-rolniczych";

export const metadata: Metadata = {
  title: "Ceny skupu — zgłoszenia",
};

export default async function RolnictwoCenyPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-900">Ceny skupu</h1>
        <p className="mt-3 text-stone-600">Do zgłaszania cen potrzebujesz roli mieszkańca we wsi.</p>
      </main>
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900">Ceny skupu — społeczność</h1>
      <p className="mt-2 text-sm text-stone-600">
        Zgłoś cenę z własnej transakcji. Inni mieszkańcy mogą ją potwierdzić — bez udziału sołtysa.
      </p>
      <div className="mt-6">
        <FormularzCenRolniczych wioski={wioski} raporty={doPotwierdzenia} userId={user.id} />
      </div>
    </main>
  );
}
