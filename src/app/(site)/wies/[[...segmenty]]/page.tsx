import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StudzienkiProjektSwietlicy } from "@/components/wies/studzienki-projekt-swietlicy";
import { WiesPostPubliczny } from "@/components/wies/wies-post-publiczny";
import { WiesProfilPubliczny } from "@/components/wies/wies-profil-publiczny";
import { WiesJsonLd } from "@/components/wies/wies-json-ld";
import type { PrzewodnikSamorzadowyZapis } from "@/components/wies/sekcja-przewodnik-samorzadowy";
import { WiesSzukajTresci } from "@/components/wies/wies-szukaj-tresci";
import { roleDlaUprawnienia } from "@/lib/panel/uprawnienia-wsi";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import {
  HubGminyStrona,
  HubPowiatuStrona,
  HubWojewodztwaStrona,
} from "@/components/wies/hub-administracyjny-strona";
import {
  pobierzHubGminyCached,
  pobierzHubPowiatuCached,
  pobierzHubWojewodztwaCached,
} from "@/lib/wies/hub-administracyjny";
import { pobierzDanePubliczneProfiluWsi } from "@/lib/wies/pobierz-dane-publiczne-profilu-wsi";
import { maCiasteczkaSesjiSupabaseSerwer } from "@/lib/auth/ciasteczka-sesji";
import { pobierzLinkiPrzydatneDlaWsiGminy } from "@/lib/wies/pobierz-linki-przydatne";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { znajdzWiesPoSciezce } from "@/lib/wies/znajdz-wies-po-sciezce";
import { etykietaKategoriiDotacji } from "@/lib/wies/teksty-dotacji";
import { czyWydarzenieKgw, czyWydarzenieLowieckie, czyWydarzenieOsp, czyWydarzenieParafialne, etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";
import { normalizujKategorieLinku, type LinkPrzydatnyPubliczny } from "@/lib/wies/linki-przydatne";
import { pobierzPlanCmentarzaPubliczny } from "@/lib/cmentarz/pobierz-cmentarz-publiczny";
import { CmentarzPublicznyKlient } from "@/components/cmentarz/cmentarz-publiczny-klient";
import { pobierzDaneMapyWsi } from "@/lib/mapa/pobierz-dane-mapy-wsi";
import { mapujOgloszeniaRynekDlaMapy } from "@/lib/mapa/rynek-na-mapie";
import { mapujDzialkiRynekDlaMapy } from "@/lib/mapa/rynek-dzialki-na-mapie";
import { aktywnyBannerRynku } from "@/lib/marketplace/banner-rynku";
import { wzbogacOfertyOZaufanie, zaufanieZLiczby } from "@/lib/marketplace/zaufanie-sprzedawcy";
import type { ZnacznikPoi, ZnacznikRynek, ZnacznikRynekDzialka, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";

type Props = {
  params: { segmenty?: string[] };
  searchParams?: { q?: string | string[]; liturgia?: string | string[]; kgw?: string | string[]; osp?: string | string[]; mysliwi?: string | string[] };
};

export const revalidate = 120;

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
  equipment_category?: string | null;
  location_text: string | null;
  price_amount: number | null;
  price_unit?: string | null;
  currency: string | null;
  with_operator?: boolean | null;
  image_urls?: string[] | null;
  seller_verified?: boolean | null;
  published_at: string | null;
  created_at: string;
  parcel_area_m2?: number | null;
  parcel_number?: string | null;
  geoportal_parcel_id?: string | null;
  view_count?: number;
  owner_user_id?: string | null;
};

const POLE_SELECT_RYNEK_LISTA =
  "id, title, listing_type, category, equipment_category, location_text, price_amount, price_unit, currency, with_operator, image_urls, published_at, created_at, seller_verified, parcel_area_m2, parcel_number, geoportal_parcel_id, view_count, owner_user_id";

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

  if (supabase && s.length >= 1 && s.length <= 3) {
    if (s.length === 3) {
      const hub = await pobierzHubGminyCached(s[0]!, s[1]!, s[2]!);
      if (hub) {
        return {
          title: `Wsie w gminie ${hub.gmina} — powiat ${hub.powiat}`,
          description: `${hub.wies.length} miejscowości w gminie ${hub.gmina}, woj. ${hub.wojewodztwo} — profile, ogłoszenia i świetlice na naszawies.pl.`,
        };
      }
    }
    if (s.length === 2) {
      const hub = await pobierzHubPowiatuCached(s[0]!, s[1]!);
      if (hub) {
        return {
          title: `Gminy i wsie — powiat ${hub.powiat}`,
          description: `${hub.gminy.length} gmin, ${hub.wies.length} miejscowości w powiecie ${hub.powiat}, woj. ${hub.wojewodztwo}.`,
        };
      }
    }
    if (s.length === 1) {
      const hub = await pobierzHubWojewodztwaCached(s[0]!);
      if (hub) {
        return {
          title: `Powiaty i wsie — ${hub.wojewodztwo}`,
          description: `${hub.powiaty.length} powiatów, ${hub.wies.length} miejscowości w woj. ${hub.wojewodztwo}.`,
        };
      }
    }
  }

  if (s.length === 4) {
    if (!supabase) return { title: "Profil wsi" };
    const wies = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
    if (wies) {
      const { sciezkaProfiluWsi } = await import("@/lib/wies/sciezka-publiczna");
      const sciezka = sciezkaProfiluWsi(wies);
      const opis =
        wies.description?.replace(/\s+/g, " ").trim().slice(0, 160) ||
        `Profil wsi ${wies.name} — ogłoszenia, mapa, świetlica i społeczność lokalna na naszawies.pl. Dołącz za darmo.`;
      return {
        title: `${wies.name} — profil wsi`,
        description: opis,
        alternates: { canonical: sciezka },
        openGraph: {
          title: `${wies.name} na naszawies.pl`,
          description: opis,
          url: sciezka,
          type: "website",
          images: wies.cover_image_url ? [{ url: wies.cover_image_url, alt: wies.name }] : undefined,
        },
        twitter: {
          card: wies.cover_image_url ? "summary_large_image" : "summary",
          title: `${wies.name} — naszawies.pl`,
          description: opis,
          images: wies.cover_image_url ? [wies.cover_image_url] : undefined,
        },
      };
    }
  }
  if (s.length === 5 && s[4] === "cmentarz") {
    if (!supabase) return { title: "Plan cmentarza" };
    const wiesMeta = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
    if (wiesMeta) {
      return {
        title: `Plan cmentarza — ${wiesMeta.name}`,
        description: `Wyszukiwarka grobów, układ kwater i rzędów — cmentarz we wsi ${wiesMeta.name}.`,
      };
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
  if (s.length === 5 && s[4] === "rynek") {
    if (!supabase) return { title: "Rynek lokalny" };
    const wiesMeta = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
    if (wiesMeta) {
      return {
        title: `Rynek lokalny — ${wiesMeta.name}`,
        description: `Ogłoszenia mieszkańców i gospodarstw we wsi ${wiesMeta.name}: miód, sery, maszyny, działki, usługi i praca.`,
      };
    }
  }
  if (s.length === 6 && s[4] === "rynek") {
    const id = z.string().uuid().safeParse(s[5]);
    if (id.success) {
      if (!supabase) return { title: "Ogłoszenie — rynek lokalny" };
      const wiesMeta = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
      if (wiesMeta) {
        const { data: ogl } = await supabase
          .from("marketplace_listings")
          .select("title, description, image_urls, price_amount, price_unit, currency, parcel_area_m2, equipment_category, category")
          .eq("id", id.data)
          .eq("village_id", wiesMeta.id)
          .eq("status", "approved")
          .maybeSingle();
        if (ogl?.title) {
          const opisRaw = ogl.description?.replace(/\s+/g, " ").trim() ?? "";
          const { formatujPowierzchnieDzialki } = await import("@/lib/marketplace/nieruchomosci");
          const pow = formatujPowierzchnieDzialki(ogl.parcel_area_m2 as number | null);
          const cena =
            ogl.price_amount != null
              ? `${ogl.price_amount} ${ogl.currency ?? "PLN"}${ogl.price_unit ? ` / ${ogl.price_unit}` : ""}`
              : null;
          const opisMeta = [opisRaw.slice(0, 120), cena, pow].filter(Boolean).join(" · ").slice(0, 160);
          const zdjecie = ogl.image_urls?.[0];
          return {
            title: `${ogl.title} — rynek · ${wiesMeta.name}`,
            description: opisMeta || `Ogłoszenie na lokalnym rynku we wsi ${wiesMeta.name}.`,
            openGraph: zdjecie ? { images: [{ url: zdjecie }] } : undefined,
          };
        }
      }
    }
  }
  if (s.length === 7 && s[4] === "rynek" && s[5] === "uslugi") {
    const idProfilu = z.string().uuid().safeParse(s[6]);
    if (idProfilu.success) {
      if (!supabase) return { title: "Profil usługodawcy" };
      const wiesMeta = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
      if (wiesMeta) {
        const { data: profil } = await supabase
          .from("marketplace_profiles")
          .select("business_name, short_description")
          .eq("id", idProfilu.data)
          .eq("village_id", wiesMeta.id)
          .eq("is_active", true)
          .maybeSingle();
        if (profil?.business_name) {
          return {
            title: `${profil.business_name} — usługi · ${wiesMeta.name}`,
            description:
              profil.short_description?.slice(0, 160) ??
              `Profil usługodawcy na lokalnym rynku we wsi ${wiesMeta.name}.`,
          };
        }
      }
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

  if (segmenty.length >= 1 && segmenty.length <= 3) {
    const supabase = createPublicSupabaseClient();
    if (!supabase) {
      return (
        <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
          <h1 className="font-serif text-2xl text-green-950">Strona chwilowo niedostępna</h1>
        </main>
      );
    }

    if (segmenty.length === 3) {
      const hub = await pobierzHubGminyCached(segmenty[0]!, segmenty[1]!, segmenty[2]!);
      if (hub) {
        const linkiPrzydatne = await pobierzLinkiPrzydatneDlaWsiGminy(
          supabase,
          hub.wies.map((w) => w.id),
        );
        return <HubGminyStrona hub={hub} linkiPrzydatne={linkiPrzydatne} />;
      }
    }
    if (segmenty.length === 2) {
      const hub = await pobierzHubPowiatuCached(segmenty[0]!, segmenty[1]!);
      if (hub) return <HubPowiatuStrona hub={hub} />;
    }
    if (segmenty.length === 1) {
      const hub = await pobierzHubWojewodztwaCached(segmenty[0]!);
      if (hub) return <HubWojewodztwaStrona hub={hub} />;
    }

    notFound();
  }

  if (segmenty.length < 4) {
    notFound();
  }

  const [woj, powiat, gmina, slug, ...reszta] = segmenty;
  if (!woj || !powiat || !gmina || !slug) {
    notFound();
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return (
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
    const danePubliczne = await pobierzDanePubliczneProfiluWsi(wies.id, wies.is_active);

    const posty = danePubliczne.postyRaw as {
      id: string;
      title: string;
      type: string;
      created_at: string;
      is_pinned?: boolean | null;
      event_end_at?: string | null;
    }[];

    const plakatyPubliczne = danePubliczne.plakatyPubliczne;
    let konkursFoto = danePubliczne.konkursFoto
      ? { ...danePubliczne.konkursFoto, mojGlosPhotoId: null as string | null }
      : null;
    const fotokronikaPubliczna = danePubliczne.fotokronikaPubliczna;
    const ostrzezeniaLowieckie = danePubliczne.ostrzezeniaLowieckie;
    const blogRaw = danePubliczne.blogRaw;
    const historiaRaw = danePubliczne.historiaRaw;
    const rynekRaw = danePubliczne.rynekRaw;
    const wiadomosciRaw = danePubliczne.wiadomosciRaw;
    const profileRaw = danePubliczne.profileRaw;
    const orgRaw = danePubliczne.orgRaw;
    const wydRaw = danePubliczne.wydRaw;
    const slotyRaw = danePubliczne.slotyRaw;
    const dotacjeSkrotRaw = danePubliczne.dotacjeSkrotRaw;
    const przewodnikRaw = danePubliczne.przewodnikRaw;
    const linkiPrzydatneRaw = danePubliczne.linkiPrzydatneRaw;
    const kontaktyUrzedoweRaw = danePubliczne.kontaktyUrzedoweRaw;
    const kadencjeFunkcyjneRaw = danePubliczne.kadencjeFunkcyjneRaw;
    const pomocSasiedzkaRaw = danePubliczne.pomocSasiedzkaRaw;
    const zgloszeniaPubliczneRaw = danePubliczne.zgloszeniaPubliczneRaw;
    const maPlanCmentarza = !!danePubliczne.planCmentarzaId;
    const liczbaMieszkancowAktywnych = danePubliczne.liczbaMieszkancowAktywnych;

    let userSesji: { id: string } | null = null;
    let mapaZnacznik: ZnacznikWsi | null = null;
    let mapaPoi: ZnacznikPoi[] = [];
    let mozeEdytowacListeZakupow = false;
    let mozeZobaczycListeZakupow = false;
    const zapisaneTresci: Record<string, string> = {};
    let listaZakupow: {
      id: string;
      title: string;
      note: string | null;
      quantity_text: string | null;
      is_done: boolean;
      created_by: string | null;
    }[] = [];

    if (maCiasteczkaSesjiSupabaseSerwer()) {
      const supabaseSerwer = utworzKlientaSupabaseSerwer();
      const {
        data: { session },
      } = await supabaseSerwer.auth.getSession();
      userSesji = session?.user ?? null;

      if (userSesji) {
        const [daneMapy, uvrResult, zapisaneResult] = await Promise.all([
          pobierzDaneMapyWsi(supabase, wies),
          supabaseSerwer
            .from("user_village_roles")
            .select("id")
            .eq("user_id", userSesji.id)
            .eq("village_id", wies.id)
            .eq("status", "active")
            .in("role", [...roleDlaUprawnienia("zarzadzanie_kgw")])
            .maybeSingle(),
          supabaseSerwer
            .from("user_saved_content")
            .select("id, content_type, content_id")
            .eq("user_id", userSesji.id)
            .eq("village_id", wies.id),
        ]);
        mapaZnacznik = daneMapy.znacznik;
        mapaPoi = daneMapy.pois;
        mozeZobaczycListeZakupow = !!uvrResult.data;
        mozeEdytowacListeZakupow = !!uvrResult.data;
        for (const row of zapisaneResult.data ?? []) {
          zapisaneTresci[`${row.content_type}:${row.content_id}`] = row.id;
        }
        if (mozeZobaczycListeZakupow) {
          const { data: zakupyRaw } = await supabaseSerwer
            .from("village_shopping_list_items")
            .select("id, title, note, quantity_text, is_done, created_by")
            .eq("village_id", wies.id)
            .order("is_done", { ascending: true })
            .order("created_at", { ascending: true });
          listaZakupow = (zakupyRaw ?? []) as typeof listaZakupow;
        }

        if (konkursFoto?.konkurs) {
          const { data: glos } = await supabaseSerwer
            .from("village_photo_votes")
            .select("photo_id")
            .eq("contest_id", konkursFoto.konkurs.id)
            .eq("user_id", userSesji.id)
            .maybeSingle();
          konkursFoto = { ...konkursFoto, mojGlosPhotoId: (glos?.photo_id as string) ?? null };
        }
      }
    }

    const blog = (blogRaw ?? []) as BlogWpis[];
    const historia = (historiaRaw ?? []) as HistoriaWpis[];
    const rynek = wzbogacOfertyOZaufanie((rynekRaw ?? []) as RynekOferta[]);
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
      contact_email: string | null;
      profile_data: unknown;
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

    const dotacjeSkrot = (dotacjeSkrotRaw ?? []) as {
      id: string;
      category: string;
      title: string;
      summary: string | null;
      application_deadline: string | null;
    }[];
    const przewodnikSamorzadowy = (przewodnikRaw as PrzewodnikSamorzadowyZapis | null) ?? null;
    const linkiPrzydatne: LinkPrzydatnyPubliczny[] = (linkiPrzydatneRaw ?? []).map((row) => {
      const r = row as {
        id: string;
        category: string;
        title: string;
        url: string;
        phone: string | null;
        email: string | null;
        note: string | null;
        display_order: number;
      };
      return {
        id: r.id,
        category: normalizujKategorieLinku(r.category),
        title: r.title,
        url: r.url,
        phone: r.phone,
        email: r.email,
        note: r.note,
        display_order: r.display_order,
      };
    });
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

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://naszawies.pl").replace(/[\r\n]+/g, "").trim();

    return (
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 text-stone-800">
        <WiesJsonLd wies={wies} siteUrl={siteUrl} />
        <p className="mb-6 text-sm text-stone-500">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
          {" · "}
          <Link href={linkChroniony("/mapa", !!userSesji)} className="text-green-800 underline">
            Mapa wsi
          </Link>
        </p>
        <WiesProfilPubliczny
          wies={wies}
          posty={posty}
          plakatyPubliczne={plakatyPubliczne}
          konkursFoto={konkursFoto}
          fotokronikaPubliczna={fotokronikaPubliczna}
          ostrzezeniaLowieckie={ostrzezeniaLowieckie}
          blog={blog}
          historia={historia}
          rynek={rynek}
          wiadomosci={wiadomosci}
          profileUslug={profileUslug}
          organizacje={organizacje}
          wydarzenia={wydarzenia}
          pomocSasiedzka={(pomocSasiedzkaRaw ?? []) as {
            id: string;
            kind: string;
            category: string;
            title: string;
            body: string;
            contact_hint: string | null;
            published_at: string | null;
            created_at: string;
          }[]}
          zgloszeniaPubliczne={(zgloszeniaPubliczneRaw ?? []) as {
            id: string;
            title: string;
            category: string;
            resolution_note: string;
            resolved_at: string | null;
          }[]}
          listaZakupow={listaZakupow}
          mozeZobaczycListeZakupow={mozeZobaczycListeZakupow}
          mozeEdytowacListeZakupow={mozeEdytowacListeZakupow}
          harmonogramTygodnia={harmonogramTygodnia}
          dotacjeSkrot={dotacjeSkrot}
          przewodnikSamorzadowy={przewodnikSamorzadowy}
          linkiPrzydatne={linkiPrzydatne}
          kontaktyUrzedowe={kontaktyUrzedowe}
          kadencjeFunkcyjne={kadencjeFunkcyjne}
          zalogowany={!!userSesji}
          mapaZnacznik={mapaZnacznik}
          mapaPoi={mapaPoi}
          maPlanCmentarza={maPlanCmentarza}
          zapisaneTresci={zapisaneTresci}
          liczbaMieszkancowAktywnych={liczbaMieszkancowAktywnych ?? 0}
        />
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "rynek") {
    const sciezka = sciezkaProfiluWsi(wies);
    const supabaseSerwer = utworzKlientaSupabaseSerwer();
    const {
      data: { session: sesjaRynek },
    } = await supabaseSerwer.auth.getSession();
    const userRynek = sesjaRynek?.user ?? null;

    const [
      { data: rynekPelny },
      { data: profileRynek },
      { data: metaWies },
      { data: wierszeGeo },
      { data: wierszeDzialki },
    ] = await Promise.all([
      supabase
        .from("marketplace_listings")
        .select(POLE_SELECT_RYNEK_LISTA)
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(100),
      supabase
        .from("marketplace_profiles")
        .select("id, business_name, short_description, categories, phone, is_verified")
        .eq("village_id", wies.id)
        .eq("is_active", true)
        .order("is_verified", { ascending: false })
        .order("business_name"),
      supabase
        .from("villages")
        .select("rynek_banner_text, rynek_banner_until, latitude, longitude, population, boundary_geojson")
        .eq("id", wies.id)
        .maybeSingle(),
      supabase
        .from("marketplace_listings")
        .select("id, title, listing_type, latitude, longitude, village_id")
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(200),
      supabase
        .from("marketplace_listings")
        .select("id, title, listing_type, equipment_category, category, parcel_geojson, parcel_area_m2, village_id")
        .eq("village_id", wies.id)
        .eq("status", "approved")
        .not("parcel_geojson", "is", null)
        .limit(80),
    ]);

    let subskrybowaneKategorie: (string | null)[] = [];
    if (userRynek) {
      const { data: subs } = await supabaseSerwer
        .from("marketplace_category_subscriptions")
        .select("equipment_category")
        .eq("user_id", userRynek.id)
        .eq("village_id", wies.id);
      subskrybowaneKategorie = (subs ?? []).map((s) => s.equipment_category ?? null);
    }

    const wiesPoId = new Map([[wies.id, { name: wies.name, sciezka }]]);
    const punktyRynek: ZnacznikRynek[] = mapujOgloszeniaRynekDlaMapy(
      (wierszeGeo ?? []) as Parameters<typeof mapujOgloszeniaRynekDlaMapy>[0],
      wiesPoId,
    );
    const punktyRynekDzialki: ZnacznikRynekDzialka[] = mapujDzialkiRynekDlaMapy(
      (wierszeDzialki ?? []) as Parameters<typeof mapujDzialkiRynekDlaMapy>[0],
      wiesPoId,
    );

    const { znacznik: znacznikMapy } = await pobierzDaneMapyWsi(supabase, {
      id: wies.id,
      name: wies.name,
      slug: wies.slug,
      voivodeship: wies.voivodeship,
      county: wies.county,
      commune: wies.commune,
      latitude: metaWies?.latitude ?? wies.latitude,
      longitude: metaWies?.longitude ?? wies.longitude,
      population: wies.population,
      boundary_geojson: metaWies?.boundary_geojson,
    });

    const ogloszenia = wzbogacOfertyOZaufanie((rynekPelny ?? []) as RynekOferta[]);
    const profile = profileRynek ?? [];
    const bannerTekst = aktywnyBannerRynku(metaWies?.rynek_banner_text, metaWies?.rynek_banner_until);

    const { MarketplaceListaKlient } = await import("@/components/wies/marketplace-lista-klient");
    const { OkruszkiRynku, NaglowekStronyRynku, RynekBannerSezonowy } = await import("@/components/wies/rynek-ui");
    const { KartaProfiluRynku } = await import("@/components/wies/karta-profilu-rynku");
    const { RynekMapaEmbedded } = await import("@/components/wies/rynek-mapa-embedded");

    return (
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 text-stone-800">
        <OkruszkiRynku sciezkaWsi={sciezka} nazwaWsi={wies.name} />
        {bannerTekst ? <RynekBannerSezonowy tekst={bannerTekst} /> : null}
        <NaglowekStronyRynku
          tytul={`Rynek lokalny — ${wies.name}`}
          opis="Miód, sery, mięso, warzywa z gospodarstw, maszyny rolnicze, działki z mapą Geoportalu, konie i usługi mieszkańców. Ogłoszenia są darmowe — każde jest widoczne 2 tygodnie, potem wygasa i można je aktywować ponownie."
          liczbaOgloszen={ogloszenia.length}
          liczbaProfili={profile.length}
        />

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,32%)] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-8">
            {profile.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold text-stone-800">Profile usługodawców</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                  {profile.map((p) => (
                    <li key={p.id}>
                      <KartaProfiluRynku profil={p} sciezkaWsi={sciezka} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="text-sm font-semibold text-stone-800">Wszystkie ogłoszenia</h2>
              <MarketplaceListaKlient
                oferty={ogloszenia}
                sciezkaWsi={sciezka}
                villageId={wies.id}
                nazwaWsi={wies.name}
                zalogowany={!!userRynek}
                subskrybowaneKategorie={subskrybowaneKategorie}
                kotwicaZasadSwietlicy={`${sciezka}#swietlica-regulamin`}
                pokazLinkWszystkie={false}
                tryb="pelny"
                kotwicaMapyRynek="#rynek-mapa"
              />
            </section>

            <div className="lg:hidden">
              <RynekMapaEmbedded
                nazwaWsi={wies.name}
                sciezkaWsi={sciezka}
                villageId={wies.id}
                znacznikWsi={znacznikMapy}
                punktyRynek={punktyRynek}
                punktyRynekDzialki={punktyRynekDzialki}
                className="mt-0"
              />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky [top:var(--sticky-nav-offset)]">
              <RynekMapaEmbedded
                nazwaWsi={wies.name}
                sciezkaWsi={sciezka}
                villageId={wies.id}
                znacznikWsi={znacznikMapy}
                punktyRynek={punktyRynek}
                punktyRynekDzialki={punktyRynekDzialki}
                kompakt
                className="mt-0"
              />
            </div>
          </aside>
        </div>
      </main>
    );
  }

  if (reszta.length === 3 && reszta[0] === "rynek" && reszta[1] === "uslugi") {
    const idProfilu = z.string().uuid().safeParse(reszta[2]);
    if (!idProfilu.success) notFound();

    const { data: profil } = await supabase
      .from("marketplace_profiles")
      .select(
        "id, business_name, short_description, details, phone, email, website, categories, service_area, is_verified",
      )
      .eq("id", idProfilu.data)
      .eq("village_id", wies.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!profil) notFound();

    const { data: ogloszeniaProfilu } = await supabase
      .from("marketplace_listings")
      .select(POLE_SELECT_RYNEK_LISTA)
      .eq("village_id", wies.id)
      .eq("profile_id", profil.id)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false });

    const sciezka = sciezkaProfiluWsi(wies);
    const { RynekProfilUslugPubliczny } = await import("@/components/wies/rynek-profil-uslug-publiczny");
    const { OkruszkiRynku } = await import("@/components/wies/rynek-ui");

    return (
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-8 text-stone-800 sm:px-6 sm:py-12">
        <OkruszkiRynku sciezkaWsi={sciezka} nazwaWsi={wies.name} biezacy={profil.business_name} />
        <RynekProfilUslugPubliczny
          profil={profil}
          ogloszenia={wzbogacOfertyOZaufanie((ogloszeniaProfilu ?? []) as RynekOferta[])}
          sciezkaWsi={sciezka}
        />
      </main>
    );
  }

  if (reszta.length === 2 && reszta[0] === "rynek") {
    const idOgl = z.string().uuid().safeParse(reszta[1]);
    if (!idOgl.success) notFound();

    const supabaseSerwer = utworzKlientaSupabaseSerwer();
    const {
      data: { session: sesjaRynek },
    } = await supabaseSerwer.auth.getSession();
    const userRynek = sesjaRynek?.user ?? null;

    const { data: ogl } = await supabase
      .from("marketplace_listings")
      .select(
        "id, village_id, title, description, listing_type, category, equipment_category, price_amount, price_unit, with_operator, phone, location_text, image_urls, published_at, created_at, owner_user_id, status, seller_verified, latitude, longitude, pickup_in_village, delivery_radius_km, seasonal_note, product_produced_at, product_best_before, is_organic, allergens_text, sales_poi_id, profile_id, parcel_geojson, parcel_number, cadastral_district, parcel_area_m2, geoportal_parcel_id, view_count, currency, pois(name), marketplace_profiles(id, business_name, is_verified)",
      )
      .eq("id", idOgl.data)
      .eq("village_id", wies.id)
      .eq("status", "approved")
      .maybeSingle();

    if (!ogl) notFound();

    const sciezka = sciezkaProfiluWsi(wies);
    let zapisaneId: string | null = null;
    let obserwujCene = false;
    let zaufanieSprzedawcy: import("@/lib/marketplace/zaufanie-sprzedawcy").ZaufanieSprzedawcy | null = null;
    if (userRynek) {
      const { data: zapis } = await supabaseSerwer
        .from("user_saved_content")
        .select("id, watch_price")
        .eq("user_id", userRynek.id)
        .eq("content_type", "listing")
        .eq("content_id", ogl.id)
        .maybeSingle();
      zapisaneId = zapis?.id ?? null;
      obserwujCene = Boolean(zapis?.watch_price);
    }

    if (ogl.owner_user_id) {
      const { count } = await supabase
        .from("marketplace_listings")
        .select("id", { count: "exact", head: true })
        .eq("village_id", wies.id)
        .eq("owner_user_id", ogl.owner_user_id)
        .eq("status", "approved");
      zaufanieSprzedawcy = zaufanieZLiczby(count ?? 0);
    }

    const katOgl = ogl.equipment_category ?? ogl.category;
    let zapytaniePodobne = supabase
      .from("marketplace_listings")
      .select("id, title, listing_type, price_amount, price_unit, equipment_category, category")
      .eq("village_id", wies.id)
      .eq("status", "approved")
      .neq("id", ogl.id)
      .order("published_at", { ascending: false })
      .limit(4);
    if (katOgl) {
      zapytaniePodobne = zapytaniePodobne.or(`equipment_category.eq.${katOgl},category.eq.${katOgl}`);
    }
    const { data: podobneRaw } = await zapytaniePodobne;

    const { RynekOgloszenieSzczegoly } = await import("@/components/wies/rynek-ogloszenie-szczegoly");
    const { OkruszkiRynku } = await import("@/components/wies/rynek-ui");

    const profilPowiazany = (() => {
      const p = Array.isArray(ogl.marketplace_profiles) ? ogl.marketplace_profiles[0] : ogl.marketplace_profiles;
      if (!p || typeof p !== "object" || !("id" in p)) return null;
      return p as { id: string; business_name: string; is_verified: boolean };
    })();

    return (
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-8 text-stone-800 sm:px-6 sm:py-12">
        <OkruszkiRynku sciezkaWsi={sciezka} nazwaWsi={wies.name} biezacy={ogl.title.slice(0, 60)} />
        <RynekOgloszenieSzczegoly
          ogloszenie={{
            ...ogl,
            image_urls: ogl.image_urls ?? [],
            sales_poi_name: (() => {
              const p = Array.isArray(ogl.pois) ? ogl.pois[0] : ogl.pois;
              return (p as { name: string } | null)?.name ?? null;
            })(),
          }}
          sciezkaWsi={sciezka}
          nazwaWsi={wies.name}
          wojewodztwo={wies.voivodeship}
          villageId={wies.id}
          zalogowany={!!userRynek}
          toJa={userRynek?.id === ogl.owner_user_id}
          zapisaneId={zapisaneId}
          obserwujCene={obserwujCene}
          zaufanieSprzedawcy={zaufanieSprzedawcy}
          profilSprzedawcy={profilPowiazany}
          podobne={(podobneRaw ?? []) as {
            id: string;
            title: string;
            listing_type: string;
            price_amount: number | null;
            price_unit: string | null;
            equipment_category: string | null;
            category: string | null;
          }[]}
        />
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "szukaj") {
    const qParam = Array.isArray(searchParams?.q) ? searchParams.q[0] : searchParams?.q;
    return <WiesSzukajTresci supabase={supabase} wies={wies} qSurowe={qParam ?? ""} />;
  }

  if (reszta.length === 1 && reszta[0] === "cmentarz") {
    if (!wies.is_active) {
      notFound();
    }
    const plan = await pobierzPlanCmentarzaPubliczny(supabase, wies.id);
    if (!plan) {
      notFound();
    }
    const sciezka = sciezkaProfiluWsi(wies);
    return (
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-12 text-stone-800 sm:px-6 sm:py-16">
        <CmentarzPublicznyKlient nazwaWsi={wies.name} sciezkaWsi={sciezka} plan={plan} />
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "projekt-swietlicy") {
    if (wies.teryt_id !== "0088390") {
      notFound();
    }
    const sciezka = sciezkaProfiluWsi(wies);
    return (
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-12 text-stone-800 sm:px-6 sm:py-16">
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
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
    const tylkoLiturgia =
      searchParams?.liturgia === "1" ||
      searchParams?.liturgia === "true" ||
      (Array.isArray(searchParams?.liturgia) && searchParams.liturgia.includes("1"));
    const tylkoKgw =
      searchParams?.kgw === "1" ||
      searchParams?.kgw === "true" ||
      (Array.isArray(searchParams?.kgw) && searchParams.kgw.includes("1"));
    const tylkoOsp =
      searchParams?.osp === "1" ||
      searchParams?.osp === "true" ||
      (Array.isArray(searchParams?.osp) && searchParams.osp.includes("1"));
    const tylkoMysliwi =
      searchParams?.mysliwi === "1" ||
      searchParams?.mysliwi === "true" ||
      (Array.isArray(searchParams?.mysliwi) && searchParams.mysliwi.includes("1"));
    const listaWidoczna = tylkoLiturgia
      ? lista.filter((w) => czyWydarzenieParafialne(w.event_kind, nazwaPowiazanejGrupy(w.village_community_groups)))
      : tylkoKgw
        ? lista.filter((w) => czyWydarzenieKgw(w.event_kind, nazwaPowiazanejGrupy(w.village_community_groups)))
        : tylkoOsp
          ? lista.filter((w) => czyWydarzenieOsp(w.event_kind, nazwaPowiazanejGrupy(w.village_community_groups)))
          : tylkoMysliwi
            ? lista.filter((w) => czyWydarzenieLowieckie(w.event_kind, nazwaPowiazanejGrupy(w.village_community_groups)))
            : lista;
    return (
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={sciezka} className="text-green-800 underline">
            ← {wies.name}
          </Link>
          {tylkoLiturgia || tylkoKgw || tylkoOsp || tylkoMysliwi ? (
            <>
              {" · "}
              <Link href={`${sciezka}/wydarzenia`} className="text-green-800 underline">
                Wszystkie wydarzenia
              </Link>
            </>
          ) : null}
        </p>
        <h1 className="font-serif text-2xl text-green-950">
          {tylkoLiturgia
            ? "Kalendarz wydarzeń parafialnych"
            : tylkoKgw
              ? "Kalendarz wydarzeń KGW"
              : tylkoOsp
                ? "Kalendarz wydarzeń OSP"
                : tylkoMysliwi
                  ? "Kalendarz wydarzeń koła łowieckiego"
                  : "Kalendarz wydarzeń"}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {tylkoLiturgia
            ? "Msze św., nabożeństwa, katechezy i spotkania przypisane do parafii."
            : tylkoKgw
              ? "Zebrania, kiermasze, festyny i warsztaty KGW."
              : tylkoOsp
                ? "Ćwiczenia, zebrania i uroczystości jednostki OSP."
                : tylkoMysliwi
                  ? "Polowania, zebrania koła, szkolenia i uroczystości myśliwskie."
                  : "Mecze, wyjazdy, próby zespołów, festyny i spotkania — wg daty rozpoczęcia."}
        </p>
        {!tylkoLiturgia && !tylkoKgw && !tylkoOsp && !tylkoMysliwi ? (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href={`${sciezka}/wydarzenia?liturgia=1`} className="text-violet-800 underline">
              Tylko wydarzenia parafialne →
            </Link>
            <Link href={`${sciezka}/wydarzenia?kgw=1`} className="text-rose-800 underline">
              Tylko wydarzenia KGW →
            </Link>
            <Link href={`${sciezka}/wydarzenia?osp=1`} className="text-red-800 underline">
              Tylko wydarzenia OSP →
            </Link>
            <Link href={`${sciezka}/wydarzenia?mysliwi=1`} className="text-emerald-800 underline">
              Tylko wydarzenia myśliwych →
            </Link>
          </div>
        ) : null}
        {listaWidoczna.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">
            {tylkoLiturgia
              ? "Brak zaplanowanych wydarzeń parafialnych."
              : tylkoKgw
                ? "Brak zaplanowanych wydarzeń KGW."
                : tylkoOsp
                  ? "Brak zaplanowanych wydarzeń OSP."
                  : tylkoMysliwi
                    ? "Brak zaplanowanych wydarzeń koła łowieckiego."
                    : "Brak zaplanowanych wydarzeń."}
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {listaWidoczna.map((w) => {
              const ng = nazwaPowiazanejGrupy(w.village_community_groups);
              return (
              <li key={w.id}>
                <Link
                  href={`${sciezka}/wydarzenia/${w.id}`}
                  className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/40"
                >
                  <p className="font-medium text-stone-900">{w.title}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    {etykietaRodzajuWydarzenia(w.event_kind)} ·{" "}
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
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
    <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
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
