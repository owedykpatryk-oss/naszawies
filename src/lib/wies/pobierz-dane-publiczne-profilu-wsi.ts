import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzPublicznePlakatyWsi } from "@/app/(site)/panel/grafika/akcje";
import type { PlakatPubliczny } from "@/components/grafika/galeria-plakatow-wsi";
import { pobierzFotokronikePublicznaWsi } from "@/lib/fotokronika/pobierz-fotokronike-publiczna";
import type { ZdjeciePubliczne } from "@/lib/fotokronika/pobierz-fotokronike-publiczna";
import type { KonkursFotoPubliczny, ZdjecieKonkursu } from "@/lib/konkurs-foto/fazy-konkursu";
import { pobierzAktywneOstrzezeniaLowieckie } from "@/lib/lowiectwo/pobierz-ostrzezenia-publiczne";
import type { OstrzezenieLowieckie } from "@/lib/lowiectwo/pobierz-ostrzezenia-publiczne";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const POLE_RYNEK =
  "id, title, listing_type, category, equipment_category, location_text, price_amount, price_unit, currency, with_operator, image_urls, published_at, created_at, seller_verified, parcel_area_m2, parcel_number, geoportal_parcel_id, view_count, owner_user_id";

export type SuroweDanePubliczneProfiluWsi = {
  postyRaw: unknown[];
  plakatyPubliczne: PlakatPubliczny[];
  konkursFoto: { konkurs: KonkursFotoPubliczny; zdjecia: ZdjecieKonkursu[] } | null;
  fotokronikaPubliczna: ZdjeciePubliczne[];
  ostrzezeniaLowieckie: OstrzezenieLowieckie[];
  blogRaw: unknown[];
  historiaRaw: unknown[];
  rynekRaw: unknown[];
  wiadomosciRaw: unknown[];
  profileRaw: unknown[];
  orgRaw: unknown[];
  wydRaw: unknown[];
  slotyRaw: unknown[];
  dotacjeSkrotRaw: unknown[];
  przewodnikRaw: unknown | null;
  linkiPrzydatneRaw: unknown[];
  kontaktyUrzedoweRaw: unknown[];
  kadencjeFunkcyjneRaw: unknown[];
  pomocSasiedzkaRaw: unknown[];
  zgloszeniaPubliczneRaw: unknown[];
  planCmentarzaId: string | null;
  liczbaMieszkancowAktywnych: number;
};

async function pobierzKonkursBezGlosu(
  supabase: SupabaseClient,
  villageId: string,
): Promise<{ konkurs: KonkursFotoPubliczny; zdjecia: ZdjecieKonkursu[] } | null> {
  const { data: konkursy } = await supabase
    .from("village_photo_contests")
    .select(
      "id, title, description, rules_text, status, submissions_start, submissions_end, voting_start, voting_end, max_entries_per_user, winner_photo_id",
    )
    .eq("village_id", villageId)
    .in("status", ["submissions", "voting", "closed"])
    .order("created_at", { ascending: false })
    .limit(1);

  const w = konkursy?.[0];
  if (!w) return null;

  const konkurs: KonkursFotoPubliczny = {
    id: w.id,
    title: w.title,
    description: w.description,
    rulesText: w.rules_text,
    status: w.status,
    submissionsStart: w.submissions_start,
    submissionsEnd: w.submissions_end,
    votingStart: w.voting_start,
    votingEnd: w.voting_end,
    maxEntriesPerUser: w.max_entries_per_user,
    winnerPhotoId: w.winner_photo_id,
  };

  let zdjecia: ZdjecieKonkursu[] = [];
  if (konkurs.status === "voting" || konkurs.status === "closed") {
    const { data: fotki } = await supabase
      .from("photos")
      .select("id, url, caption, vote_count, created_at")
      .eq("contest_id", konkurs.id)
      .eq("status", "approved")
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: true });
    zdjecia = (fotki ?? []).map((p) => ({
      id: p.id as string,
      url: p.url as string,
      caption: (p.caption as string | null) ?? null,
      voteCount: (p.vote_count as number) ?? 0,
      createdAt: p.created_at as string,
    }));
  }

  return { konkurs, zdjecia };
}

async function pobierzSuroweDanePubliczneProfiluWsi(
  villageId: string,
  isActive: boolean,
): Promise<SuroweDanePubliczneProfiluWsi> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return {
      postyRaw: [],
      plakatyPubliczne: [],
      konkursFoto: null,
      fotokronikaPubliczna: [],
      ostrzezeniaLowieckie: [],
      blogRaw: [],
      historiaRaw: [],
      rynekRaw: [],
      wiadomosciRaw: [],
      profileRaw: [],
      orgRaw: [],
      wydRaw: [],
      slotyRaw: [],
      dotacjeSkrotRaw: [],
      przewodnikRaw: null,
      linkiPrzydatneRaw: [],
      kontaktyUrzedoweRaw: [],
      kadencjeFunkcyjneRaw: [],
      pomocSasiedzkaRaw: [],
      zgloszeniaPubliczneRaw: [],
      planCmentarzaId: null,
      liczbaMieszkancowAktywnych: 0,
    };
  }

  const odWydarzen = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: postyRaw },
    plakatyPubliczne,
    konkursFoto,
    fotokronikaPubliczna,
    ostrzezeniaLowieckie,
    { data: blogRaw },
    { data: historiaRaw },
    { data: rynekRaw },
    { data: wiadomosciRaw },
    { data: profileRaw },
    { data: orgRaw },
    { data: wydRaw },
    { data: slotyRaw },
    { data: dotacjeSkrotRaw },
    { data: przewodnikRaw },
    { data: linkiPrzydatneRaw },
    { data: kontaktyUrzedoweRaw },
    { data: kadencjeFunkcyjneRaw },
    { data: pomocSasiedzkaRaw },
    { data: zgloszeniaPubliczneRaw },
    planCmentarzaRes,
    { count: liczbaMieszkancowAktywnych },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, type, created_at, is_pinned, event_end_at")
      .eq("village_id", villageId)
      .eq("status", "approved")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(25),
    isActive ? pobierzPublicznePlakatyWsi(villageId) : Promise.resolve([]),
    isActive ? pobierzKonkursBezGlosu(supabase, villageId) : Promise.resolve(null),
    isActive ? pobierzFotokronikePublicznaWsi(supabase, villageId) : Promise.resolve([]),
    isActive ? pobierzAktywneOstrzezeniaLowieckie(supabase, villageId) : Promise.resolve([]),
    supabase
      .from("village_blog_posts")
      .select("id, title, excerpt, created_at, published_at")
      .eq("village_id", villageId)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from("village_history_entries")
      .select("id, title, short_description, event_date, created_at")
      .eq("village_id", villageId)
      .eq("status", "approved")
      .order("event_date", { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from("marketplace_listings")
      .select(POLE_RYNEK)
      .eq("village_id", villageId)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from("local_news_items")
      .select("id, title, summary, category, source_name, source_url, published_at, created_at")
      .eq("village_id", villageId)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from("marketplace_profiles")
      .select("id, business_name, short_description, categories, phone, is_verified")
      .eq("village_id", villageId)
      .eq("is_active", true)
      .order("is_verified", { ascending: false })
      .limit(6),
    supabase
      .from("village_community_groups")
      .select(
        "id, group_type, name, short_description, meeting_place, schedule_text, contact_phone, contact_email, profile_data",
      )
      .eq("village_id", villageId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("village_community_events")
      .select(
        "id, event_kind, title, description, location_text, starts_at, ends_at, group_id, village_community_groups(name)",
      )
      .eq("village_id", villageId)
      .eq("status", "approved")
      .gte("starts_at", odWydarzen)
      .order("starts_at", { ascending: true })
      .limit(12),
    supabase
      .from("village_weekly_schedule_slots")
      .select("id, day_of_week, time_start, time_end, title, description, village_community_groups(name)")
      .eq("village_id", villageId)
      .order("day_of_week", { ascending: true })
      .order("time_start", { ascending: true })
      .limit(56),
    supabase
      .from("village_funding_sources")
      .select("id, category, title, summary, application_deadline")
      .eq("village_id", villageId)
      .eq("status", "approved")
      .order("application_deadline", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from("village_civic_guides")
      .select(
        "commune_info, county_info, voivodeship_info, roads_info, waste_info, utilities_info, other_info",
      )
      .eq("village_id", villageId)
      .maybeSingle(),
    supabase
      .from("village_useful_links")
      .select("id, category, title, url, phone, email, note, display_order")
      .eq("village_id", villageId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("title", { ascending: true }),
    supabase
      .from("village_official_contacts")
      .select(
        "id, office_key, role_label, person_name, organization_name, contact_phone, contact_email, duty_hours_text, note, cta_label, cta_url, is_verified_by_soltys, updated_at",
      )
      .eq("village_id", villageId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(20),
    supabase
      .from("village_official_terms")
      .select("id, office_key, role_label, person_name, organization_name, term_start, term_end, note, is_current")
      .eq("village_id", villageId)
      .order("term_start", { ascending: false })
      .limit(24),
    supabase
      .from("neighbor_help_offers")
      .select("id, kind, category, title, body, contact_hint, published_at, created_at")
      .eq("village_id", villageId)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from("issues")
      .select("id, title, category, resolution_note, resolved_at")
      .eq("village_id", villageId)
      .eq("status", "rozwiazane")
      .not("resolution_note", "is", null)
      .order("resolved_at", { ascending: false, nullsFirst: false })
      .limit(12),
    isActive
      ? supabase
          .from("village_cemetery_plans")
          .select("id")
          .eq("village_id", villageId)
          .eq("is_published", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("user_village_roles")
      .select("id", { count: "exact", head: true })
      .eq("village_id", villageId)
      .eq("role", "mieszkaniec")
      .eq("status", "active"),
  ]);

  return {
    postyRaw: postyRaw ?? [],
    plakatyPubliczne,
    konkursFoto,
    fotokronikaPubliczna,
    ostrzezeniaLowieckie,
    blogRaw: blogRaw ?? [],
    historiaRaw: historiaRaw ?? [],
    rynekRaw: rynekRaw ?? [],
    wiadomosciRaw: wiadomosciRaw ?? [],
    profileRaw: profileRaw ?? [],
    orgRaw: orgRaw ?? [],
    wydRaw: wydRaw ?? [],
    slotyRaw: slotyRaw ?? [],
    dotacjeSkrotRaw: dotacjeSkrotRaw ?? [],
    przewodnikRaw: przewodnikRaw ?? null,
    linkiPrzydatneRaw: linkiPrzydatneRaw ?? [],
    kontaktyUrzedoweRaw: kontaktyUrzedoweRaw ?? [],
    kadencjeFunkcyjneRaw: kadencjeFunkcyjneRaw ?? [],
    pomocSasiedzkaRaw: pomocSasiedzkaRaw ?? [],
    zgloszeniaPubliczneRaw: zgloszeniaPubliczneRaw ?? [],
    planCmentarzaId: (planCmentarzaRes.data as { id?: string } | null)?.id ?? null,
    liczbaMieszkancowAktywnych: liczbaMieszkancowAktywnych ?? 0,
  };
}

/** Cache 120 s — współdzielony między żądaniami (największy zysk TTFB na profilu wsi). */
export function pobierzDanePubliczneProfiluWsi(villageId: string, isActive: boolean) {
  return unstable_cache(
    () => pobierzSuroweDanePubliczneProfiluWsi(villageId, isActive),
    ["profil-wsi-publiczny", villageId, isActive ? "1" : "0"],
    { revalidate: 120, tags: [`profil-wsi-${villageId}`] },
  )();
}
