import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { ZespolKlient } from "./zespol-klient";

export const metadata: Metadata = { title: "Zespół — współadmin" };

export default async function SoltysZespolPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/logowanie?next=/panel/soltys/zespol");

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Zespół i współadministratorzy"
        dzieci={<p className="text-sm text-stone-600">Brak uprawnień panelu sołtysa.</p>}
      />
    );
  }

  const { data: wsie } = await supabase.from("villages").select("id, name").in("id", villageIds).order("name");

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("id, user_id, village_id, created_at")
    .in("village_id", villageIds)
    .eq("role", "wspoladmin")
    .eq("status", "active");

  const userIds = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));
  const mapaNazw: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, display_name").in("id", userIds);
    for (const u of users ?? []) mapaNazw[u.id] = u.display_name;
  }
  const mapaWsi = Object.fromEntries((wsie ?? []).map((w) => [w.id, w.name]));

  const wspoladmini = (roleRows ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    village_id: r.village_id,
    wies_nazwa: mapaWsi[r.village_id] ?? "Wieś",
    display_name: mapaNazw[r.user_id] ?? r.user_id.slice(0, 8),
    created_at: r.created_at,
  }));

  return (
    <PanelStronaSoltysa
      szeroki
      tytul="Zespół i współadministratorzy"
      opis="Zaufane osoby z dostępem do panelu sołtysa — bez zmiany formalnego sołtysa w systemie."
      dzieci={<ZespolKlient wsie={wsie ?? []} wspoladmini={wspoladmini} />}
    />
  );
}
