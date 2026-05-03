import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StudzienkiProjektSwietlicy } from "@/components/wies/studzienki-projekt-swietlicy";
import { WiesPostPubliczny } from "@/components/wies/wies-post-publiczny";
import { pobierzKalendarzZajetosciDlaWsi } from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import { WiesProfilPubliczny } from "@/components/wies/wies-profil-publiczny";
import type { PrzewodnikSamorzadowyZapis } from "@/components/wies/sekcja-przewodnik-samorzadowy";
import { WiesSzukajTresci } from "@/components/wies/wies-szukaj-tresci";
import { roleDlaUprawnienia } from "@/lib/panel/uprawnienia-wsi";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { znajdzWiesPoSciezce } from "@/lib/wies/znajdz-wies-po-sciezce";
import { etykietaKategoriiDotacji } from "@/lib/wies/teksty-dotacji";

type Props = {
  params: { segmenty?: string[] };
  searchParams?: { q?: string | string[] };
};

type BlogWpis = {
  id: string;
  title: string;
  excerpt: string | null;
  created_at: string;
  published_at: string | null;
};

type HistoriaWpis = {
  id: string;
  title: string;
  short_description: string | null;
  event_date: string | null;
  created_at: string;
};

type RynekOferta = {
  id: string;
  title: string;
  listing_type: string;
  category: string | null;
  location_text: string | null;
  price_amount: number | null;
  currency: string | null;
  published_at: string | null;
  created_at: string;
};

type WiadomoscLokalna = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source_name: string | null;
  published_at: string | null;
  created_at: string;
};

function nazwaPowiazanejGrupy(rel: { name: string } | { name: string }[] | null | undefined): string | null {
  if (rel == null) return null;
  if (Array.isArray(rel)) return rel[0]?.name ?? null;
  return rel.name ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = params.segmenty ?? [];
  const supabase = createPublicSupabaseClient();
  if (s.length === 4) {
    if (!supabase) return { title: "Profil wsi" };
    const wies = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
    if (wies) {
      return { title: `${wies.name} — profil wsi`, description: wies.description?.slice(0, 160) ?? undefined };
    }
  }
  if (s.length === 5 && s[4] === "projekt-swietlicy") {
    if (!supabase) return { title: "Projekt świetlicy" };
    const wiesMeta = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
    if (wiesMeta?.teryt_id === "0088390") {
      return {
        title: `Projekt świetlicy — ${wiesMeta.name}`,
        description:
          "Rozbudowa i przebudowa świetlicy wiejskiej w Studzienkach: rzut parteru, zestawienie pomieszczeń, elewacje i kolorystyka.",
      };
    }
  }
  if (s.length === 6 && s[4] === "ogloszenie") {
    const id = z.string().uuid().safeParse(s[5]);
    if (id.success) {
      if (!supabase) return { title: "Ogłoszenie" };
      const { data: post } = await supabase
        .from("posts")
        .select("title, village_id")
        .eq("id", id.data)
        .maybeSingle();
      if (post?.title) {
        return { title: `${post.title} — ogłoszenie` };
      }
    }
  }
  return { title: "Profil wsi" };
}

export default async function WiesCatchAllPage({ params, searchParams }: Props) {
  const segmenty = params.segmenty ?? [];

  if (segmenty.length < 4) {
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Niepełny adres strony wsi</h1>
        <p className="mt-2 text-stone-600">
          Użyj pełnego linku do wsi (np. ze strony wyników wyszukiwania albo z paska przeglądarki, gdy już jesteś na
          stronie sołectwa). Adres zawiera województwo, powiat, gminę i skróconą nazwę wsi.
        </p>
        <p className="mt-4 text-sm text-stone-600">
          <Link href="/szukaj" className="text-green-800 underline">
            Wyszukaj miejscowość
          </Link>
        </p>
      </main>
    );
  }

  const [woj, powiat, gmina, slug, ...reszta] = segmenty;
  if (!woj || !powiat || !gmina || !slug) {
    notFound();
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Strona chwilowo niedostępna</h1>
        <p className="mt-2 text-sm text-stone-600">
          Nie udało się załadować danych. Spróbuj ponownie za chwilę albo wróć na stronę główną.
        </p>
      </main>
    );
  }

  const wies = await znajdzWiesPoSciezce(supabase, woj, powiat, gmina, slug);
  if (!wies) {
    notFound();
  }

  if (reszta.length === 0) {
    const { data: postyRaw } = await supabase
      .from("posts")
      .select("id, title, type, created_at")
      .eq("village_id", wies.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(25);

    const posty = (postyRaw ?? []) as { id: string; title: string; type: string; created_at: string }[];

    const kalendarz = wies.is_active ? await pobierzKalendarzZajetosciDlaWsi(supabase, wies.id) : [];

    const odWydarzen = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const supabaseSerwer = utworzKlientaSupabaseSerwer();
    const [
      authRes,
      { data: blogRaw },
      { data: historiaRaw },
      { data: rynekRaw },
      { data: wiadomosciRaw },
      { data: profileRaw },
      { data: orgRaw },
      { data: wydRaw },
      { data: zakupyRaw },
      { data: slotyRaw },
      { data: dotacjeSkrotRaw },
      { data: przewodnikRaw },
      { data: transportStatusRaw },
      { data: transportOdjazdyRaw },
      { data: kontaktyUrzedoweRaw },
      { data: kadencjeFunkcyjneRaw },
      { data: geoKontekstRaw },
      { data: adresyRaw },
      { data: granicaRaw },
    ] = await Promise.all([
      supabaseSerwer.auth.getUser(),
      supabase
        .from("village_blog_posts")
        .select("id, title, excerpt, created_at, published_at")
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(6),
      supabase
        .from("village_history_entries")
        .select("id, title, short_description, event_date, created_at")
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .order("event_date", { ascending: false, nullsFirst: false })
        .limit(6),
      supabase
        .from("marketplace_listings")
        .select("id, title, listing_type, category, location_text, price_amount, currency, published_at, created_at")
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(8),
      supabase
        .from("local_news_items")
        .select("id, title, summary, category, source_name, published_at, created_at")
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(6),
      supabase
        .from("marketplace_profiles")
        .select("id, business_name, short_description, categories, phone, is_verified")
        .eq("village_id", wies.id)
        .eq("is_active", true)
        .order("is_verified", { ascending: false })
        .limit(6),
      supabase
        .from("village_community_groups")
        .select("id, group_type, name, short_description, meeting_place, schedule_text, contact_phone")
        .eq("village_id", wies.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("village_community_events")
        .select(
          "id, event_kind, title, description, location_text, starts_at, ends_at, group_id, village_community_groups(name)",
        )
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .gte("starts_at", odWydarzen)
        .order("starts_at", { ascending: true })
        .limit(12),
      supabase
        .from("village_shopping_list_items")
        .select("id, title, note, quantity_text, is_done, created_by")
        .eq("village_id", wies.id)
        .order("is_done", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("village_weekly_schedule_slots")
        .select(
          "id, day_of_week, time_start, time_end, title, description, village_community_groups(name)",
        )
        .eq("village_id", wies.id)
        .order("day_of_week", { ascending: true })
        .order("time_start", { ascending: true }),
      supabase
        .from("village_funding_sources")
        .select("id, category, title, summary, application_deadline")
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .order("application_deadline", { ascending: true, nullsFirst: false })
        .limit(6),
      supabase
        .from("village_civic_guides")
        .select(
          "commune_info, county_info, voivodeship_info, roads_info, waste_info, utilities_info, other_info",
        )
        .eq("village_id", wies.id)
        .maybeSingle(),
      supabase
        .from("village_transport_line_status")
        .select("status_color, status_label, delayed_count, cancelled_count, fallback_mode, updated_at")
        .eq("village_id", wies.id)
        .maybeSingle(),
      supabase
        .from("transport_departures_cache")
        .select(
          "id, station_name, train_label, destination, platform, planned_at, realtime_at, delay_min, is_cancelled, status, fetched_at",
        )
        .eq("village_id", wies.id)
        .gte("planned_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order("planned_at", { ascending: true })
        .limit(8),
      supabase
        .from("village_official_contacts")
        .select(
          "id, office_key, role_label, person_name, organization_name, contact_phone, contact_email, duty_hours_text, note, cta_label, cta_url, is_verified_by_soltys, updated_at",
        )
        .eq("village_id", wies.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(20),
      supabase
        .from("village_official_terms")
        .select("id, office_key, role_label, person_name, organization_name, term_start, term_end, note, is_current")
        .eq("village_id", wies.id)
        .order("term_start", { ascending: false })
        .limit(24),
      supabase
        .from("geo_context_features")
        .select("id, dataset, layer_name, feature_category, feature_name, latitude, longitude, updated_at")
        .eq("village_id", wies.id)
        .order("updated_at", { ascending: false })
        .limit(80),
      supabase
        .from("address_points")
        .select("id, street_name, house_number, postal_code, latitude, longitude, updated_at")
        .eq("village_id", wies.id)
        .order("street_name", { ascending: true })
        .order("house_number", { ascending: true })
        .limit(500),
      supabase
        .from("villages")
        .select("boundary_geojson")
        .eq("id", wies.id)
        .maybeSingle(),
    ]);

    const userSesji = authRes.data.user;
    let mozeEdytowacListeZakupow = false;
    if (userSesji) {
      const { data: uvr } = await supabaseSerwer
        .from("user_village_roles")
        .select("id")
        .eq("user_id", userSesji.id)
        .eq("village_id", wies.id)
        .eq("status", "active")
        .in("role", [...roleDlaUprawnienia("dostep_podstawowy")])
        .maybeSingle();
      mozeEdytowacListeZakupow = !!uvr;
    }

    const blog = (blogRaw ?? []) as BlogWpis[];
    const historia = (historiaRaw ?? []) as HistoriaWpis[];
    const rynek = (rynekRaw ?? []) as RynekOferta[];
    const wiadomosci = (wiadomosciRaw ?? []) as WiadomoscLokalna[];
    const profileUslug = (profileRaw ?? []) as {
      id: string;
      business_name: string;
      short_description: string | null;
      categories: string[] | null;
      phone: string | null;
      is_verified: boolean;
    }[];

    type WierszWydarzeniaRaw = {
      id: string;
      event_kind: string;
      title: string;
      description: string | null;
      location_text: string | null;
      starts_at: string;
      ends_at: string | null;
      group_id: string | null;
      village_community_groups: { name: string } | { name: string }[] | null;
    };
    const organizacje = (orgRaw ?? []) as {
      id: string;
      group_type: string;
      name: string;
      short_description: string | null;
      meeting_place: string | null;
      schedule_text: string | null;
      contact_phone: string | null;
    }[];
    const wydarzenia = ((wydRaw ?? []) as unknown as WierszWydarzeniaRaw[]).map((r) => ({
      id: r.id,
      event_kind: r.event_kind,
      title: r.title,
      description: r.description,
      location_text: r.location_text,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      nazwa_grupy: nazwaPowiazanejGrupy(r.village_community_groups),
    }));

    type WierszSlotuRaw = {
      id: string;
      day_of_week: number;
      time_start: string;
      time_end: string | null;
      title: string;
      description: string | null;
      village_community_groups: { name: string } | { name: string }[] | null;
    };
    const harmonogramTygodnia = ((slotyRaw ?? []) as unknown as WierszSlotuRaw[]).map((r) => ({
      id: r.id,
      day_of_week: r.day_of_week,
      time_start: r.time_start,
      time_end: r.time_end,
      title: r.title,
      description: r.description,
      nazwa_grupy: nazwaPowiazanejGrupy(r.village_community_groups),
    }));

    const listaZakupow = (zakupyRaw ?? []) as {
      id: string;
      title: string;
      note: string | null;
      quantity_text: string | null;
      is_done: boolean;
      created_by: string | null;
    }[];
    const dotacjeSkrot = (dotacjeSkrotRaw ?? []) as {
      id: string;
      category: string;
      title: string;
      summary: string | null;
      application_deadline: string | null;
    }[];
    const przewodnikSamorzadowy = (przewodnikRaw as PrzewodnikSamorzadowyZapis | null) ?? null;
    const transportStatus = (transportStatusRaw as {
      status_color: string;
      status_label: string;
      delayed_count: number;
      cancelled_count: number;
      fallback_mode: boolean;
      updated_at: string;
    } | null) ?? null;
    const transportOdjazdy = (transportOdjazdyRaw ?? []) as {
      id: string;
      station_name: string | null;
      train_label: string;
      destination: string | null;
      platform: string | null;
      planned_at: string;
      realtime_at: string | null;
      delay_min: number | null;
      is_cancelled: boolean;
      status: string | null;
      fetched_at: string;
    }[];
    const kontaktyUrzedowe = (kontaktyUrzedoweRaw ?? []) as {
      id: string;
      office_key: string;
      role_label: string;
      person_name: string;
      organization_name: string | null;
      contact_phone: string | null;
      contact_email: string | null;
      duty_hours_text: string | null;
      note: string | null;
      cta_label: string | null;
      cta_url: string | null;
      is_verified_by_soltys: boolean;
      updated_at: string;
    }[];
    const kadencjeFunkcyjne = (kadencjeFunkcyjneRaw ?? []) as {
      id: string;
      office_key: string;
      role_label: string;
      person_name: string;
      organization_name: string | null;
      term_start: string;
      term_end: string | null;
      note: string | null;
      is_current: boolean;
    }[];
    const geoKontekst = (geoKontekstRaw ?? []) as {
      id: string;
      dataset: string;
      layer_name: string;
      feature_category: string | null;
      feature_name: string | null;
      latitude: number | null;
      longitude: number | null;
      updated_at: string;
    }[];
    const adresyUrzedowe = (adresyRaw ?? []) as {
      id: string;
      street_name: string | null;
      house_number: string;
      postal_code: string | null;
      latitude: number;
      longitude: number;
      updated_at: string;
    }[];
    const maGraniceGeojson = Boolean((granicaRaw as { boundary_geojson?: unknown } | null)?.boundary_geojson);
    const liczbaPrng = geoKontekst.filter((x) => x.dataset === "PRNG").length;
    const liczbaInst = geoKontekst.filter((x) => x.dataset === "PRG_INSTITUTIONAL").length;

    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-6 text-sm text-stone-500">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
          {" · "}
          <Link href="/mapa" className="text-green-800 underline">
            Mapa wsi
          </Link>
        </p>
        <WiesProfilPubliczny
          wies={wies}
          posty={posty}
          kalendarzZajetosci={kalendarz}
          blog={blog}
          historia={historia}
          rynek={rynek}
          wiadomosci={wiadomosci}
          profileUslug={profileUslug}
          organizacje={organizacje}
          wydarzenia={wydarzenia}
          listaZakupow={listaZakupow}
          mozeEdytowacListeZakupow={mozeEdytowacListeZakupow}
          harmonogramTygodnia={harmonogramTygodnia}
          dotacjeSkrot={dotacjeSkrot}
          przewodnikSamorzadowy={przewodnikSamorzadowy}
          transportStatus={transportStatus}
          transportOdjazdy={transportOdjazdy}
          kontaktyUrzedowe={kontaktyUrzedowe}
          kadencjeFunkcyjne={kadencjeFunkcyjne}
          geoKontekst={geoKontekst}
          adresyUrzedowe={adresyUrzedowe}
          geoJakosc={{
            maGraniceGeojson,
            liczbaAdresow: adresyUrzedowe.length,
            liczbaPrng,
            liczbaInstytucji: liczbaInst,
          }}
        />
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "szukaj") {
    const qParam = Array.isArray(searchParams?.q) ? searchParams.q[0] : searchParams?.q;
    return <WiesSzukajTresci supabase={supabase} wies={wies} qSurowe={qParam ?? ""} />;
  }

  if (reszta.length === 1 && reszta[0] === "projekt-swietlicy") {
    if (wies.teryt_id !== "0088390") {
      notFound();
    }
    const sciezka = sciezkaProfiluWsi(wies);
    return (
      <main className="mx-auto min-w-0 max-w-5xl py-12 sm:py-16 text-stone-800">
        <StudzienkiProjektSwietlicy sciezkaWsi={sciezka} nazwaWsi={wies.name} />
      </main>
    );
  }

  if (reszta.length === 2 && reszta[0] === "ogloszenie") {
    const idPosta = z.string().uuid().safeParse(reszta[1]);
    if (!idPosta.success) {
      notFound();
    }

    const { data: post, error } = await supabase
      .from("posts")
      .select("id, title, type, body, created_at, village_id, status")
      .eq("id", idPosta.data)
      .maybeSingle();

    if (error || !post || post.village_id !== wies.id) {
      notFound();
    }

    const sciezka = sciezkaProfiluWsi(wies);

    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <WiesPostPubliczny
          tytul={post.title}
          typ={post.type}
          utworzono={post.created_at}
          tresc={post.body}
          sciezkaWsi={sciezka}
          nazwaWsi={wies.name}
        />
      </main>
    );
  }

  if (reszta.length === 2 && reszta[0] === "blog") {
    const idWpisu = z.string().uuid().safeParse(reszta[1]);
    if (!idWpisu.success) {
      notFound();
    }
    const { data: wpis, error } = await supabase
      .from("village_blog_posts")
      .select("id, title, excerpt, body, created_at, published_at, village_id")
      .eq("id", idWpisu.data)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !wpis || wpis.village_id !== wies.id) {
      notFound();
    }
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={sciezkaProfiluWsi(wies)} className="text-green-800 underline">
            ← {wies.name}
          </Link>
        </p>
        <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-stone-500">Blog lokalny</p>
          <h1 className="mt-1 font-serif text-2xl text-green-950">{wpis.title}</h1>
          <p className="mt-2 text-xs text-stone-500">
            {new Date(wpis.published_at ?? wpis.created_at).toLocaleDateString("pl-PL")}
          </p>
          {wpis.excerpt ? <p className="mt-3 text-sm font-medium text-stone-700">{wpis.excerpt}</p> : null}
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{wpis.body}</div>
        </article>
      </main>
    );
  }

  if (reszta.length === 2 && reszta[0] === "historia") {
    const idWpisu = z.string().uuid().safeParse(reszta[1]);
    if (!idWpisu.success) {
      notFound();
    }
    const { data: wpis, error } = await supabase
      .from("village_history_entries")
      .select("id, title, short_description, body, event_date, created_at, village_id")
      .eq("id", idWpisu.data)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !wpis || wpis.village_id !== wies.id) {
      notFound();
    }
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={sciezkaProfiluWsi(wies)} className="text-green-800 underline">
            ← {wies.name}
          </Link>
        </p>
        <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-stone-500">Historia wsi</p>
          <h1 className="mt-1 font-serif text-2xl text-green-950">{wpis.title}</h1>
          <p className="mt-2 text-xs text-stone-500">
            {wpis.event_date
              ? `Data wydarzenia: ${new Date(wpis.event_date).toLocaleDateString("pl-PL")}`
              : `Dodano: ${new Date(wpis.created_at).toLocaleDateString("pl-PL")}`}
          </p>
          {wpis.short_description ? <p className="mt-3 text-sm font-medium text-stone-700">{wpis.short_description}</p> : null}
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{wpis.body}</div>
        </article>
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "blog") {
    const { data: wpisy } = await supabase
      .from("village_blog_posts")
      .select("id, title, excerpt, published_at, created_at")
      .eq("village_id", wies.id)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(60);
    const lista = (wpisy ?? []) as BlogWpis[];
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={sciezkaProfiluWsi(wies)} className="text-green-800 underline">
            ← {wies.name}
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Blog mieszkańców</h1>
        <p className="mt-2 text-sm text-stone-600">Najnowsze wpisy blogowe opublikowane dla tej wsi.</p>
        {lista.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">Brak opublikowanych wpisów.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {lista.map((w) => (
              <li key={w.id}>
                <Link
                  href={`${sciezkaProfiluWsi(wies)}/blog/${w.id}`}
                  className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
                >
                  <p className="font-medium text-stone-900">{w.title}</p>
                  {w.excerpt ? <p className="mt-1 text-sm text-stone-700">{w.excerpt}</p> : null}
                  <p className="mt-2 text-xs text-stone-500">
                    {new Date(w.published_at ?? w.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  if (reszta.length === 2 && reszta[0] === "wydarzenia") {
    const idWyd = z.string().uuid().safeParse(reszta[1]);
    if (!idWyd.success) {
      notFound();
    }
    const { data: ev, error } = await supabase
      .from("village_community_events")
      .select(
        "id, title, description, location_text, starts_at, ends_at, event_kind, village_id, village_community_groups(name)",
      )
      .eq("id", idWyd.data)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !ev || ev.village_id !== wies.id) {
      notFound();
    }
    const grupaNazwa = nazwaPowiazanejGrupy(
      (ev as { village_community_groups?: { name: string } | { name: string }[] | null }).village_community_groups,
    );
    const sciezka = sciezkaProfiluWsi(wies);
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={`${sciezka}/wydarzenia`} className="text-green-800 underline">
            ← Kalendarz wydarzeń
          </Link>
          {" · "}
          <Link href={sciezka} className="text-green-800 underline">
            {wies.name}
          </Link>
        </p>
        <p className="text-xs uppercase tracking-wide text-indigo-800">Wydarzenie</p>
        <h1 className="mt-1 font-serif text-2xl text-green-950">{ev.title}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {new Date(ev.starts_at).toLocaleString("pl-PL", { dateStyle: "full", timeStyle: "short" })}
          {ev.ends_at
            ? ` — ${new Date(ev.ends_at).toLocaleTimeString("pl-PL", { timeStyle: "short" })}`
            : null}
          {ev.location_text ? ` · ${ev.location_text}` : null}
          {grupaNazwa ? ` · ${grupaNazwa}` : null}
        </p>
        {ev.description ? (
          <div className="mt-6 whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-800 shadow-sm">
            {ev.description}
          </div>
        ) : null}
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "wydarzenia") {
    const { data: listaRaw } = await supabase
      .from("village_community_events")
      .select(
        "id, title, event_kind, location_text, starts_at, ends_at, village_community_groups(name)",
      )
      .eq("village_id", wies.id)
      .eq("status", "approved")
      .order("starts_at", { ascending: true })
      .limit(120);
    type W = {
      id: string;
      title: string;
      event_kind: string;
      location_text: string | null;
      starts_at: string;
      ends_at: string | null;
      village_community_groups: { name: string } | { name: string }[] | null;
    };
    const lista = (listaRaw ?? []) as unknown as W[];
    const sciezka = sciezkaProfiluWsi(wies);
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={sciezka} className="text-green-800 underline">
            ← {wies.name}
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Kalendarz wydarzeń</h1>
        <p className="mt-2 text-sm text-stone-600">
          Mecze, wyjazdy, próby zespołów, festyny i spotkania — wg daty rozpoczęcia.
        </p>
        {lista.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">Brak zaplanowanych wydarzeń.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {lista.map((w) => {
              const ng = nazwaPowiazanejGrupy(w.village_community_groups);
              return (
              <li key={w.id}>
                <Link
                  href={`${sciezka}/wydarzenia/${w.id}`}
                  className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/40"
                >
                  <p className="font-medium text-stone-900">{w.title}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    {new Date(w.starts_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                    {w.location_text ? ` · ${w.location_text}` : ""}
                    {ng ? ` · ${ng}` : ""}
                  </p>
                </Link>
              </li>
            );
            })}
          </ul>
        )}
      </main>
    );
  }

  if (reszta.length === 2 && reszta[0] === "dotacje") {
    const idDot = z.string().uuid().safeParse(reszta[1]);
    if (!idDot.success) {
      notFound();
    }
    const { data: row, error } = await supabase
      .from("village_funding_sources")
      .select(
        "id, title, summary, body, category, source_url, amount_hint, application_deadline, village_id",
      )
      .eq("id", idDot.data)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !row || row.village_id !== wies.id) {
      notFound();
    }
    const sciezka = sciezkaProfiluWsi(wies);
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={`${sciezka}/dotacje`} className="text-green-800 underline">
            ← Źródła dofinansowania
          </Link>
          {" · "}
          <Link href={sciezka} className="text-green-800 underline">
            {wies.name}
          </Link>
        </p>
        <p className="text-xs uppercase tracking-wide text-emerald-900">{etykietaKategoriiDotacji(row.category)}</p>
        <h1 className="mt-1 font-serif text-2xl text-green-950">{row.title}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {row.amount_hint ? <span className="block">Szacowany zakres: {row.amount_hint}</span> : null}
          {row.application_deadline ? (
            <span className="block">
              Termin naboru: {new Date(row.application_deadline).toLocaleDateString("pl-PL", { dateStyle: "long" })}
            </span>
          ) : null}
          {row.source_url ? (
            <a
              href={row.source_url}
              className="mt-2 inline-block text-green-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Link do programu / ogłoszenia
            </a>
          ) : null}
        </p>
        {row.summary ? <p className="mt-4 text-sm text-stone-700">{row.summary}</p> : null}
        {row.body ? (
          <div className="mt-6 whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-800 shadow-sm">
            {row.body}
          </div>
        ) : null}
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "dotacje") {
    const { data: listaDotRaw } = await supabase
      .from("village_funding_sources")
      .select("id, title, category, summary, application_deadline")
      .eq("village_id", wies.id)
      .eq("status", "approved")
      .order("application_deadline", { ascending: true, nullsFirst: false });
    const listaDot = (listaDotRaw ?? []) as {
      id: string;
      title: string;
      category: string;
      summary: string | null;
      application_deadline: string | null;
    }[];
    const sciezka = sciezkaProfiluWsi(wies);
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={sciezka} className="text-green-800 underline">
            ← {wies.name}
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Źródła dofinansowania</h1>
        <p className="mt-2 text-sm text-stone-600">
          Zestawienie informacyjne: fundusz sołecki, programy gminne i krajowe, fundacje — zawsze sprawdź aktualne
          kryteria u wnioskodawcy.
        </p>
        {listaDot.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">Brak zapisanych źródeł.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {listaDot.map((d) => (
              <li key={d.id}>
                <Link
                  href={`${sciezka}/dotacje/${d.id}`}
                  className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <p className="text-xs text-emerald-900">{etykietaKategoriiDotacji(d.category)}</p>
                  <p className="mt-1 font-medium text-stone-900">{d.title}</p>
                  {d.summary ? <p className="mt-1 line-clamp-2 text-sm text-stone-700">{d.summary}</p> : null}
                  {d.application_deadline ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Termin: {new Date(d.application_deadline).toLocaleDateString("pl-PL")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "historia") {
    const { data: wpisy } = await supabase
      .from("village_history_entries")
      .select("id, title, short_description, event_date, created_at")
      .eq("village_id", wies.id)
      .eq("status", "approved")
      .order("event_date", { ascending: false, nullsFirst: false })
      .limit(60);
    const lista = (wpisy ?? []) as HistoriaWpis[];
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={sciezkaProfiluWsi(wies)} className="text-green-800 underline">
            ← {wies.name}
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Historia wsi</h1>
        <p className="mt-2 text-sm text-stone-600">Kronika i wspomnienia opublikowane dla mieszkańców i gości.</p>
        {lista.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">Brak opublikowanych wpisów historii.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {lista.map((w) => (
              <li key={w.id}>
                <Link
                  href={`${sciezkaProfiluWsi(wies)}/historia/${w.id}`}
                  className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
                >
                  <p className="font-medium text-stone-900">{w.title}</p>
                  {w.short_description ? <p className="mt-1 text-sm text-stone-700">{w.short_description}</p> : null}
                  <p className="mt-2 text-xs text-stone-500">
                    {w.event_date
                      ? new Date(w.event_date).toLocaleDateString("pl-PL")
                      : new Date(w.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  const podstrona = reszta.join(" / ");
  return (
    <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
      <p className="mb-4 text-sm text-stone-500">
        <Link href={sciezkaProfiluWsi(wies)} className="text-green-800 underline">
          ← {wies.name}
        </Link>
      </p>
      <h1 className="font-serif text-2xl text-green-950">{wies.name}</h1>
      <p className="mt-4 text-stone-700">
        Sekcja <strong>{podstrona}</strong> — moduł w przygotowaniu.
      </p>
    </main>
  );
}
