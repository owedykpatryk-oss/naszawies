import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import {
  SoltysModeracjaPostowKlient,
  type PostDoModeracjiWiersz,
} from "./soltys-moderacja-postow-klient";
import { SoltysWnioskiKlient, type WniosekWiersz } from "./soltys-wnioski-klient";

export const metadata: Metadata = {
  title: "Panel sołtysa",
};

export default async function SoltysPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys");
  }

  const { data: mojeWsi } = await supabase
    .from("user_village_roles")
    .select("village_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);

  const villageIds = (mojeWsi ?? []).map((m) => m.village_id).filter(Boolean);

  const nazwyWsi: Record<string, string> = {};
  const hrefWsi: Record<string, string> = {};
  if (villageIds.length > 0) {
    const { data: vs } = await supabase
      .from("villages")
      .select("id, name, voivodeship, county, commune, slug")
      .in("id", villageIds);
    for (const v of vs ?? []) {
      nazwyWsi[v.id] = v.name;
      hrefWsi[v.id] = sciezkaProfiluWsi({
        voivodeship: v.voivodeship,
        county: v.county,
        commune: v.commune,
        slug: v.slug,
      });
    }
  }

  let wnioski: WniosekWiersz[] = [];
  type WniosekRaw = { id: string; user_id: string; village_id: string; created_at: string };
  let surowe: WniosekRaw[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("user_village_roles")
      .select("id, user_id, village_id, created_at")
      .in("village_id", villageIds)
      .eq("role", "mieszkaniec")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    surowe = (data ?? []) as WniosekRaw[];
  }

  const userIds = Array.from(new Set(surowe.map((w) => w.user_id)));

  const mapaUzytkownikow: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, display_name").in("id", userIds);
    for (const u of users ?? []) {
      mapaUzytkownikow[u.id] = u.display_name;
    }
  }

  wnioski = surowe.map((w) => ({
    id: w.id,
    created_at: w.created_at,
    wies: nazwyWsi[w.village_id] ?? "—",
    mieszkaniec: mapaUzytkownikow[w.user_id] ?? w.user_id.slice(0, 8),
  }));

  type WpisPostu = { id: string; title: string; village_id: string; created_at: string };
  let postySurowe: WpisPostu[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, village_id, created_at")
      .in("village_id", villageIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(30);
    postySurowe = (data ?? []) as WpisPostu[];
  }

  const postyDoModeracji: PostDoModeracjiWiersz[] = postySurowe.map((p) => ({
    id: p.id,
    title: p.title,
    wies: nazwyWsi[p.village_id] ?? "Wieś",
    created_at: p.created_at,
    hrefWsi: hrefWsi[p.village_id] ?? null,
  }));

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Sołtys</h1>
      <p className="mt-2 text-sm text-stone-600">
        Wnioski mieszkańców w Twoich wsiach oraz posty oczekujące na moderację (wg RLS).
      </p>

      {villageIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie jesteś zapisany jako aktywny sołtys ani współadmin w żadnej wsi. Przypisanie roli sołtysa odbywa się
          administracyjnie (np. migracja / panel gminy) — skontaktuj się z zespołem naszawies.pl.
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Wnioski o rolę mieszkańca</h2>
        <div className="mt-4">
          <SoltysWnioskiKlient wnioski={wnioski} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl text-green-950">Posty do moderacji</h2>
        <p className="mt-1 text-sm text-stone-600">
          Zatwierdzone trafiają na publiczny profil wsi (wg RLS). Przy odrzuceniu autor dostaje krótką notatkę w
          powiadomieniu w aplikacji.
        </p>
        <div className="mt-4">
          <SoltysModeracjaPostowKlient posty={postyDoModeracji} />
        </div>
      </section>

      <p className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-500">
        <Link href="/panel/soltys/rezerwacje" className="text-green-800 underline">
          Rezerwacje sal
        </Link>
        <Link href="/panel/soltys/swietlica" className="text-green-800 underline">
          Świetlica i wyposażenie
        </Link>
        <Link href="/panel/soltys/dokumenty" className="text-green-800 underline">
          Generator dokumentów
        </Link>
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          Panel mieszkańca
        </Link>
      </p>
    </main>
  );
}
