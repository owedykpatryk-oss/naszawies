import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListaZakupowWsiKlient } from "@/components/wies/lista-zakupow-wsi-klient";
import { roleDlaUprawnienia } from "@/lib/panel/uprawnienia-wsi";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Lista zakupów wsi",
};

export default async function MieszkaniecListaZakupowPage({
  searchParams,
}: {
  searchParams: { village?: string };
}) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/mieszkaniec/lista-zakupow");
  }

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(id, name, is_active)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [...roleDlaUprawnienia("dostep_podstawowy")]);

  const wsie = (roleRows ?? [])
    .map((r) => {
      const v = pojedynczaWies<{ id: string; name: string; is_active: boolean }>(r.villages);
      if (!v?.id) return null;
      return { id: v.id, name: v.name, is_active: v.is_active };
    })
    .filter(Boolean) as { id: string; name: string; is_active: boolean }[];

  if (wsie.length === 0) {
    return (
      <main>
        <h1 className="tytul-sekcji-panelu">Lista zakupów wsi</h1>
        <p className="mt-2 text-sm text-stone-600">Nie masz aktywnej roli mieszkańca ani sołtysa w żadnej wsi.</p>
        <p className="mt-4 text-sm">
          <Link href="/panel/mieszkaniec" className="text-green-800 underline">
            ← Panel mieszkańca
          </Link>
        </p>
      </main>
    );
  }

  const villageParam = searchParams.village;
  const villageId =
    villageParam && wsie.some((w) => w.id === villageParam) ? villageParam : wsie[0]!.id;

  const { data: zakupyRaw } = await supabase
    .from("village_shopping_list_items")
    .select("id, title, note, quantity_text, is_done, created_by")
    .eq("village_id", villageId)
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: true });

  const pozycje = (zakupyRaw ?? []) as {
    id: string;
    title: string;
    note: string | null;
    quantity_text: string | null;
    is_done: boolean;
    created_by: string | null;
  }[];

  const nazwaWybranejWsi = wsie.find((w) => w.id === villageId)?.name ?? "";

  return (
    <main>
      <h1 className="tytul-sekcji-panelu">Lista zakupów wsi</h1>
      <p className="mt-2 text-sm text-stone-600">
        Wspólna lista na KGW i sąsiadów — dopisuj produkty i zaznaczaj kupione. To samo widać na publicznym profilu
        wsi.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {wsie.map((w) => (
          <Link
            key={w.id}
            href={`/panel/mieszkaniec/lista-zakupow?village=${w.id}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              w.id === villageId
                ? "border-amber-700 bg-amber-100 font-medium text-amber-950"
                : "border-stone-200 bg-white text-stone-700 hover:border-amber-400"
            }`}
          >
            {w.name}
            {!w.is_active ? " (profil w przygotowaniu)" : ""}
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white p-5 shadow-sm">
        <ListaZakupowWsiKlient
          villageId={villageId}
          pozycje={pozycje}
          edytowalna
          pokazSzablony
          pokazDruk={pozycje.length > 0}
          nazwaWsi={nazwaWybranejWsi}
        />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
    </main>
  );
}
