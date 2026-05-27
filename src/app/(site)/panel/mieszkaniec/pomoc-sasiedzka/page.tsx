import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { PomocSasiedzkaFormularz } from "./pomoc-sasiedzka-formularz";

export const metadata: Metadata = { title: "Pomoc sąsiedzka" };

export default async function PomocSasiedzkaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/mieszkaniec/pomoc-sasiedzka");

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
          .from("neighbor_help_offers")
          .select("id, title, status, created_at, village_id")
          .eq("author_user_id", user.id)
          .in("village_id", villageIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] };

  return (
    <main>
      <p className="text-sm text-stone-500">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl text-green-950">Pomoc sąsiedzka</h1>
      <p className="mt-2 text-sm text-stone-600">
        Transport, zakupy, opieka — oferty widoczne na profilu wsi po zatwierdzeniu przez sołtysa.
      </p>
      <PomocSasiedzkaFormularz wsie={wsie} />
      {(moje ?? []).length > 0 ? (
        <section className="mt-8">
          <h2 className="font-serif text-xl text-green-950">Twoje ogłoszenia</h2>
          <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {(moje ?? []).map((o) => (
              <li key={o.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{o.title}</span>
                <span className="ml-2 text-stone-500">· {o.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
