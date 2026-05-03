import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
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

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

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

  let liczbaWiadomosciDoAkceptu = 0;
  let liczbaKanaalowRss = 0;
  if (villageIds.length > 0) {
    const { count: cNews } = await supabase
      .from("local_news_items")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .in("status", ["pending", "draft"]);
    liczbaWiadomosciDoAkceptu = cNews ?? 0;
    const { count: cFeeds } = await supabase
      .from("village_news_feed_sources")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds);
    liczbaKanaalowRss = cFeeds ?? 0;
  }

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Sołtys</h1>
      <p className="mt-2 text-sm text-stone-600">
        Wnioski mieszkańców w Twoich wsiach oraz posty oczekujące na moderację.
      </p>

      {villageIds.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 p-4 sm:p-5">
          <h2 className="font-serif text-lg text-green-950">Szybkie działania</h2>
          <p className="mt-1 text-xs text-stone-600">
            Skróty do modułów, które oszczędzają czas — od dokumentów po świetlicę i społeczność.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/panel/soltys/dokumenty"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Generator dokumentów</span>
              <span className="mt-1 block text-xs text-stone-600">
                Scenariusze 1‑klik i lejek sponsora (prośba → przypomnienie → wpływ → podziękowanie).
              </span>
            </Link>
            <Link
              href="/panel/soltys/rezerwacje"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Rezerwacje sal</span>
              <span className="mt-1 block text-xs text-stone-600">
                Checklista przygotowania, rekomendacje zakupów i druk dla wydarzeń.
              </span>
            </Link>
            <Link
              href="/panel/soltys/spolecznosc"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Społeczność i WOW</span>
              <span className="mt-1 block text-xs text-stone-600">
                Blog, historia, marketplace, KGW i kluby, kalendarz wydarzeń, wiadomości i automatyzacje.
              </span>
            </Link>
            <Link
              href="/panel/soltys/swietlica"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Świetlica i wyposażenie</span>
              <span className="mt-1 block text-xs text-stone-600">
                Układ sali, asortyment i szybkie pakiety wyposażenia.
              </span>
            </Link>
            <Link
              href="/panel/soltys/moja-wies"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Profil wsi</span>
              <span className="mt-1 block text-xs text-stone-600">Treści widoczne publicznie na naszawies.pl.</span>
            </Link>
            <Link
              href="/panel/soltys/wiadomosci-lokalne"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Wiadomości do akceptu</span>
              <span className="mt-1 block text-xs text-stone-600">
                {liczbaWiadomosciDoAkceptu > 0
                  ? `Oczekujące wpisy: ${liczbaWiadomosciDoAkceptu} (w tym z RSS).`
                  : "Brak oczekujących — sprawdź po synchronizacji kanałów."}
              </span>
            </Link>
            <Link
              href="/panel/soltys/kanaly-rss"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Kanały RSS</span>
              <span className="mt-1 block text-xs text-stone-600">
                {liczbaKanaalowRss > 0
                  ? `Podłączone źródła: ${liczbaKanaalowRss}.`
                  : "Brak kanałów — dodaj adres kanału gminy lub lokalnej prasy."}
              </span>
            </Link>
            <Link
              href="/panel/soltys/samorzad"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Przewodnik samorządowy</span>
              <span className="mt-1 block text-xs text-stone-600">
                Kontakty do gminy, śmieci, drogi — widoczne na profilu wsi.
              </span>
            </Link>
            <Link
              href="/panel/powiadomienia"
              className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
            >
              <span className="font-semibold text-green-950">Powiadomienia</span>
              <span className="mt-1 block text-xs text-stone-600">Filtr nieprzeczytanych i szybki podgląd treści.</span>
            </Link>
          </div>
        </section>
      ) : null}

      {villageIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie jesteś zapisany jako aktywny sołtys ani współadmin w żadnej wsi. Rola <strong>sołtysa</strong> w danej wsi
          jest <strong>jednoosobowa</strong>. Przypisania ustala zespół serwisu — skontaktuj się, jeśli to Twoja
          miejscowość, a w panelu widzisz ten komunikat.
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
          Zatwierdzone trafiają na publiczny profil wsi. Przy odrzuceniu autor dostaje krótką notatkę w
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
        <Link href="/panel/soltys/spolecznosc" className="text-green-800 underline">
          Społeczność i WOW
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
