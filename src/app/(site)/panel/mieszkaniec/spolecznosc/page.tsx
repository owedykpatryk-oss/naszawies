import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoNaszawies } from "@/components/marka/logo-naszawies";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import {
  MieszkaniecSpolecznoscKlient,
  type GlosMoj,
  type Komentarz,
  type Watek,
} from "./spolecznosc-klient";

export const metadata: Metadata = {
  title: "Społeczność mieszkańców",
  description: "Dyskusje i blog mieszkańców dla wybranych miejscowości.",
};

export default async function MieszkaniecSpolecznoscPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/logowanie?next=/panel/mieszkaniec/spolecznosc");
  }

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, status, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data: followRows } = await supabase
    .from("user_follows")
    .select("village_id, villages(name)")
    .eq("user_id", user.id);

  const villageMap = new Map<string, string>();
  for (const r of roleRows ?? []) {
    const v = pojedynczaWies<{ name: string }>(r.villages);
    if (v?.name) villageMap.set(r.village_id, v.name);
  }
  for (const f of followRows ?? []) {
    const v = pojedynczaWies<{ name: string }>(f.villages);
    if (v?.name) villageMap.set(f.village_id, v.name);
  }

  const wsie = Array.from(villageMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl"));

  if (wsie.length === 0) {
    return (
      <main>
        <h1 className="tytul-sekcji-panelu">Społeczność mieszkańców</h1>
        <p className="mt-2 text-sm text-stone-600">
          Ten moduł działa dla aktywnych ról lub obserwowanych wsi. Najpierw dołącz do miejscowości.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/panel/mieszkaniec#dolacz-mieszkaniec" className="text-green-800 underline">
            Przejdź do „Dołącz do wsi”
          </Link>
        </p>
      </main>
    );
  }

  const villageIds = wsie.map((w) => w.id);

  const [{ data: watkiRows }, { data: komentarzeRows }, { data: glosyRows }] = await Promise.all([
    supabase
      .from("village_discussion_threads")
      .select("id, village_id, author_id, title, body, category, status, comment_count, vote_score, created_at")
      .in("village_id", villageIds)
      .in("status", ["open", "closed"])
      .order("is_pinned", { ascending: false })
      .order("last_activity_at", { ascending: false })
      .limit(100),
    supabase
      .from("village_discussion_comments")
      .select("id, thread_id, author_id, body, created_at")
      .in("village_id", villageIds)
      .eq("status", "visible")
      .order("created_at", { ascending: true })
      .limit(500),
    supabase.from("village_discussion_votes").select("thread_id, vote").eq("user_id", user.id),
  ]);

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
      <div className="mb-4">
        <LogoNaszawies kompakt />
      </div>
      <h1 className="tytul-sekcji-panelu">Społeczność mieszkańców</h1>
      <p className="mt-2 text-sm text-stone-600">
        Zakładaj wątki, komentuj i zgłaszaj treści do moderacji. Blog mieszkańca trafia do akceptacji sołtysa.
      </p>
      <div className="mt-6">
        <MieszkaniecSpolecznoscKlient
          wsie={wsie}
          watki={(watkiRows ?? []) as Watek[]}
          komentarze={(komentarzeRows ?? []) as Komentarz[]}
          mojeGlosy={(glosyRows ?? []) as GlosMoj[]}
        />
      </div>
    </main>
  );
}
