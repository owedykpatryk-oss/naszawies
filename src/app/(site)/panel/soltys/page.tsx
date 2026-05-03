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
  type WniosekRaw = {
    id: string;
    user_id: string;
    village_id: string;
    created_at: string;
    role: string;
  };
  let surowe: WniosekRaw[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("user_village_roles")
      .select("id, user_id, village_id, created_at, role")
      .in("village_id", villageIds)
      .in("role", ["mieszkaniec", "osp_naczelnik", "kgw_przewodniczaca", "rada_solecka"])
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
    rola: w.role,
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
  let liczbaRezerwacjiDoDecyzji = 0;
  let liczbaWydarzen7Dni = 0;
  let liczbaGrupKgw = 0;
  let liczbaGrupOsp = 0;
  let liczbaWydarzenKgw7Dni = 0;
  let liczbaWydarzenOsp7Dni = 0;
  if (villageIds.length > 0) {
    const teraz = new Date();
    const terazIso = teraz.toISOString();
    const za7dniIso = new Date(teraz.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: cNews }, { count: cFeeds }, { data: hallsRows }, { count: cEvents7Dni }, { data: grupyRows }] =
      await Promise.all([
        supabase
          .from("local_news_items")
          .select("id", { count: "exact", head: true })
          .in("village_id", villageIds)
          .in("status", ["pending", "draft"]),
        supabase
          .from("village_news_feed_sources")
          .select("id", { count: "exact", head: true })
          .in("village_id", villageIds),
        supabase.from("halls").select("id").in("village_id", villageIds).limit(500),
        supabase
          .from("village_community_events")
          .select("id", { count: "exact", head: true })
          .in("village_id", villageIds)
          .eq("status", "approved")
          .gte("starts_at", terazIso)
          .lte("starts_at", za7dniIso),
        supabase
          .from("village_community_groups")
          .select("id, group_type")
          .in("village_id", villageIds)
          .eq("is_active", true)
          .limit(500),
      ]);

    liczbaWiadomosciDoAkceptu = cNews ?? 0;
    liczbaKanaalowRss = cFeeds ?? 0;
    liczbaWydarzen7Dni = cEvents7Dni ?? 0;

    const hallIds = (hallsRows ?? []).map((h) => h.id).filter(Boolean) as string[];
    const grupy = (grupyRows ?? []) as { id: string; group_type: string }[];
    const idsKgw = grupy.filter((g) => g.group_type === "kgw").map((g) => g.id);
    const idsOsp = grupy.filter((g) => g.group_type === "sport" || g.group_type === "osp").map((g) => g.id);
    liczbaGrupKgw = idsKgw.length;
    liczbaGrupOsp = idsOsp.length;

    const [bookingsRes, kgwRes, ospRes] = await Promise.all([
      hallIds.length > 0
        ? supabase
            .from("hall_bookings")
            .select("id", { count: "exact", head: true })
            .in("hall_id", hallIds)
            .eq("status", "pending")
        : Promise.resolve({ count: 0 }),
      idsKgw.length > 0
        ? supabase
            .from("village_community_events")
            .select("id", { count: "exact", head: true })
            .in("group_id", idsKgw)
            .eq("status", "approved")
            .gte("starts_at", terazIso)
            .lte("starts_at", za7dniIso)
        : Promise.resolve({ count: 0 }),
      idsOsp.length > 0
        ? supabase
            .from("village_community_events")
            .select("id", { count: "exact", head: true })
            .in("group_id", idsOsp)
            .eq("status", "approved")
            .gte("starts_at", terazIso)
            .lte("starts_at", za7dniIso)
        : Promise.resolve({ count: 0 }),
    ]);
    liczbaRezerwacjiDoDecyzji = bookingsRes.count ?? 0;
    liczbaWydarzenKgw7Dni = kgwRes.count ?? 0;
    liczbaWydarzenOsp7Dni = ospRes.count ?? 0;
  }

  return (
    <main>
      <h1 className="tytul-sekcji-panelu">Sołtys</h1>
      <p className="mt-2 text-sm text-stone-600">
        Wnioski o role (mieszkaniec, OSP, KGW, rada) oraz posty oczekujące na moderację.
      </p>
      <p className="mt-1 text-sm text-stone-600">
        Zaczynasz pracę? Otwórz{" "}
        <Link href="/panel/soltys/pomoc" className="text-green-800 underline">
          pomoc krok po kroku
        </Link>
        .
      </p>

      {villageIds.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-4 sm:p-5">
          <h2 className="font-serif text-lg text-green-950">Dziś do zrobienia</h2>
          <p className="mt-1 text-xs text-stone-600">
            Jedno miejsce z najważniejszymi decyzjami i najbliższymi działaniami dla Twoich wsi.
          </p>
          <div className="siatka-kafli-responsywna mt-4 lg:grid-cols-4">
            <Link
              href="/panel/soltys#wnioski-o-role"
              className="rounded-xl border border-stone-200 bg-white/95 p-3 shadow-sm transition hover:border-amber-400"
            >
              <p className="text-xs text-stone-500">Wnioski o role</p>
              <p className="mt-1 text-2xl font-semibold text-green-950">{wnioski.length}</p>
              <p className="mt-1 text-xs text-stone-600">Do akceptacji lub odrzucenia</p>
            </Link>
            <Link
              href="/panel/soltys/rezerwacje"
              className="rounded-xl border border-stone-200 bg-white/95 p-3 shadow-sm transition hover:border-amber-400"
            >
              <p className="text-xs text-stone-500">Rezerwacje sal</p>
              <p className="mt-1 text-2xl font-semibold text-green-950">{liczbaRezerwacjiDoDecyzji}</p>
              <p className="mt-1 text-xs text-stone-600">Wnioski oczekujące na decyzję</p>
            </Link>
            <Link
              href="/panel/soltys/wiadomosci-lokalne"
              className="rounded-xl border border-stone-200 bg-white/95 p-3 shadow-sm transition hover:border-amber-400"
            >
              <p className="text-xs text-stone-500">Moderacja treści</p>
              <p className="mt-1 text-2xl font-semibold text-green-950">{postyDoModeracji.length + liczbaWiadomosciDoAkceptu}</p>
              <p className="mt-1 text-xs text-stone-600">Posty + wiadomości lokalne do przejrzenia</p>
            </Link>
            <Link
              href="/panel/soltys/spolecznosc"
              className="rounded-xl border border-stone-200 bg-white/95 p-3 shadow-sm transition hover:border-amber-400"
            >
              <p className="text-xs text-stone-500">Wydarzenia 7 dni</p>
              <p className="mt-1 text-2xl font-semibold text-green-950">{liczbaWydarzen7Dni}</p>
              <p className="mt-1 text-xs text-stone-600">Zaplanowane w najbliższym tygodniu</p>
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
            <span className="rounded-full border border-stone-200 bg-white px-2 py-1">
              Kanały RSS podpięte: <strong>{liczbaKanaalowRss}</strong>
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-2 py-1">
              Wiadomości (pending/draft): <strong>{liczbaWiadomosciDoAkceptu}</strong>
            </span>
          </div>
        </section>
      ) : null}

      {villageIds.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-fuchsia-50/40 p-4 sm:p-5">
          <h2 className="font-serif text-lg text-green-950">Centra ról organizacyjnych</h2>
          <p className="mt-1 text-xs text-stone-600">
            Wejdź od razu w właściwy kontekst pracy, zamiast szukać opcji po całym panelu.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/panel/soltys/spolecznosc?tryb=kgw"
              className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/45 p-4 shadow-sm transition hover:border-fuchsia-400"
            >
              <p className="text-xs text-fuchsia-900">Centrum KGW</p>
              <p className="mt-1 text-lg font-semibold text-fuchsia-950">
                Grupy: {liczbaGrupKgw} · Wydarzenia 7 dni: {liczbaWydarzenKgw7Dni}
              </p>
              <p className="mt-1 text-xs text-stone-700">Harmonogram spotkań, inicjatywy i dokumenty pod dotacje.</p>
            </Link>
            <Link
              href="/panel/soltys/spolecznosc?tryb=osp"
              className="rounded-xl border border-indigo-200 bg-indigo-50/45 p-4 shadow-sm transition hover:border-indigo-400"
            >
              <p className="text-xs text-indigo-900">Centrum OSP / sport</p>
              <p className="mt-1 text-lg font-semibold text-indigo-950">
                Grupy: {liczbaGrupOsp} · Wydarzenia 7 dni: {liczbaWydarzenOsp7Dni}
              </p>
              <p className="mt-1 text-xs text-stone-700">
                Ćwiczenia, mecze, komunikaty bezpieczeństwa i szybkie planowanie tygodnia.
              </p>
            </Link>
          </div>
        </section>
      ) : null}

      {villageIds.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 p-4 sm:p-5">
          <h2 className="font-serif text-lg text-green-950">Szybkie działania</h2>
          <p className="mt-1 text-xs text-stone-600">
            Skróty do modułów, które oszczędzają czas — od dokumentów po świetlicę i społeczność.
          </p>
          <div className="siatka-kafli-responsywna mt-4">
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
              href="/panel/soltys/spolecznosc?tryb=kgw"
              className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/40 p-4 text-sm shadow-sm transition hover:border-fuchsia-400 hover:shadow-md"
            >
              <span className="font-semibold text-fuchsia-950">Tryb KGW</span>
              <span className="mt-1 block text-xs text-stone-600">
                Od razu filtruje moduł społeczności pod działania KGW i wydarzenia koła.
              </span>
            </Link>
            <Link
              href="/panel/soltys/spolecznosc?tryb=osp"
              className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm shadow-sm transition hover:border-indigo-400 hover:shadow-md"
            >
              <span className="font-semibold text-indigo-950">Tryb OSP / sport</span>
              <span className="mt-1 block text-xs text-stone-600">
                Szybki start dla komunikatów OSP, harmonogramu treningów i wydarzeń sportowych.
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

      <section id="wnioski-o-role" className="scroll-mt-24 mt-10">
        <h2 className="font-serif text-xl text-green-950">Wnioski o role we wsi</h2>
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
        <Link href="/panel/soltys#wnioski-o-role" className="text-green-800 underline">
          Wnioski o role
        </Link>
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
