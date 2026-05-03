import type { SupabaseClient } from "@supabase/supabase-js";

export type PakietEksportuRodo = {
  meta: {
    wygenerowano_at: string;
    wersja_pakietu: string;
    user_id: string;
    uwagi_eksportu: string[];
  };
  konto_auth: {
    id: string;
    email?: string;
    phone?: string;
    created_at?: string;
    last_sign_in_at?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    identities?: unknown[];
  } | null;
  users: unknown[] | null;
  user_village_roles: unknown[] | null;
  user_follows: unknown[] | null;
  user_web_push_subscriptions: unknown[] | null;
  user_transport_favorite_relations: unknown[] | null;
  posts: unknown[] | null;
  comments: unknown[] | null;
  notifications: unknown[] | null;
  entity_representatives: unknown[] | null;
  hall_bookings_jako_rezerwujacy_lub_akceptujacy: unknown[] | null;
  issues_jako_zglaszajacy_lub_przypisany: unknown[] | null;
  photo_albums: unknown[] | null;
  photos: unknown[] | null;
  moderation_reports: unknown[] | null;
  audit_log: unknown[] | null;
  village_bloggers: unknown[] | null;
  village_blog_posts: unknown[] | null;
  village_history_entries: unknown[] | null;
  marketplace_profiles: unknown[] | null;
  marketplace_listings: unknown[] | null;
  local_news_items: unknown[] | null;
  village_shopping_list_items: unknown[] | null;
  village_weekly_schedule_slots: unknown[] | null;
  village_funding_sources: unknown[] | null;
  village_community_groups: unknown[] | null;
  village_community_events: unknown[] | null;
  village_official_contacts: unknown[] | null;
  village_official_terms: unknown[] | null;
  village_civic_guides: unknown[] | null;
  entities_zatwierdzone_przez_uzytkownika: unknown[] | null;
};

async function pobierz<T>(
  uwagi: string[],
  tabela: string,
  zapytanie: PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<T[] | null> {
  const { data, error } = await zapytanie;
  if (error) {
    uwagi.push(`${tabela}: ${error.message}`);
    return null;
  }
  return (data ?? []) as T[];
}

/**
 * Pełny pakiet danych osobowych użytkownika (RODO — prawo dostępu).
 * Wymaga klienta service role; wywołuj wyłącznie po zweryfikowaniu tożsamości sesji.
 */
export async function zbierzPakietEksportuRodo(
  admin: SupabaseClient,
  userId: string,
  emailZSesji: string | undefined
): Promise<PakietEksportuRodo> {
  const uwagi: string[] = [];
  const meta = {
    wygenerowano_at: new Date().toISOString(),
    wersja_pakietu: "1",
    user_id: userId,
    uwagi_eksportu: uwagi,
  };

  let konto_auth: PakietEksportuRodo["konto_auth"] = null;
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) {
      uwagi.push(`auth.admin.getUserById: ${error.message}`);
      konto_auth = {
        id: userId,
        email: emailZSesji,
      };
    } else if (data.user) {
      const u = data.user;
      konto_auth = {
        id: u.id,
        email: u.email ?? emailZSesji,
        phone: u.phone ?? undefined,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? undefined,
        app_metadata: u.app_metadata as Record<string, unknown>,
        user_metadata: u.user_metadata as Record<string, unknown>,
        identities: u.identities as unknown[],
      };
    }
  } catch (e) {
    uwagi.push(`auth.admin.getUserById: ${e instanceof Error ? e.message : String(e)}`);
    konto_auth = { id: userId, email: emailZSesji };
  }

  const uid = userId;
  const orPosts = `author_id.eq.${uid},moderated_by.eq.${uid}`;
  const orBookings = `booked_by.eq.${uid},approved_by.eq.${uid}`;
  const orIssues = `reporter_id.eq.${uid},assigned_to.eq.${uid}`;
  const orPhotos = `uploaded_by.eq.${uid},moderated_by.eq.${uid}`;
  const orOfficialContacts = `created_by.eq.${uid},verified_by.eq.${uid}`;

  const [
    users,
    user_village_roles,
    user_follows,
    user_web_push_subscriptions,
    user_transport_favorite_relations,
    posts,
    comments,
    notifications,
    entity_representatives,
    hall_bookings_jako_rezerwujacy_lub_akceptujacy,
    issues_jako_zglaszajacy_lub_przypisany,
    photo_albums,
    photos,
    moderation_reports,
    audit_log,
    village_bloggers,
    village_blog_posts,
    village_history_entries,
    marketplace_profiles,
    marketplace_listings,
    local_news_items,
    village_shopping_list_items,
    village_weekly_schedule_slots,
    village_funding_sources,
    village_community_groups,
    village_community_events,
    village_official_contacts,
    village_official_terms,
    village_civic_guides,
    entities_zatwierdzone_przez_uzytkownika,
  ] = await Promise.all([
    pobierz(uwagi, "users", admin.from("users").select("*").eq("id", uid)),
    pobierz(uwagi, "user_village_roles", admin.from("user_village_roles").select("*").eq("user_id", uid)),
    pobierz(uwagi, "user_follows", admin.from("user_follows").select("*").eq("user_id", uid)),
    pobierz(uwagi, "user_web_push_subscriptions", admin.from("user_web_push_subscriptions").select("*").eq("user_id", uid)),
    pobierz(
      uwagi,
      "user_transport_favorite_relations",
      admin.from("user_transport_favorite_relations").select("*").eq("user_id", uid)
    ),
    pobierz(uwagi, "posts", admin.from("posts").select("*").or(orPosts)),
    pobierz(uwagi, "comments", admin.from("comments").select("*").eq("author_id", uid)),
    pobierz(uwagi, "notifications", admin.from("notifications").select("*").eq("user_id", uid)),
    pobierz(uwagi, "entity_representatives", admin.from("entity_representatives").select("*").eq("user_id", uid)),
    pobierz(uwagi, "hall_bookings", admin.from("hall_bookings").select("*").or(orBookings)),
    pobierz(uwagi, "issues", admin.from("issues").select("*").or(orIssues)),
    pobierz(uwagi, "photo_albums", admin.from("photo_albums").select("*").eq("created_by", uid)),
    pobierz(uwagi, "photos", admin.from("photos").select("*").or(orPhotos)),
    pobierz(uwagi, "moderation_reports", admin.from("moderation_reports").select("*").eq("reporter_id", uid)),
    pobierz(uwagi, "audit_log", admin.from("audit_log").select("*").eq("user_id", uid)),
    pobierz(uwagi, "village_bloggers", admin.from("village_bloggers").select("*").eq("user_id", uid)),
    pobierz(uwagi, "village_blog_posts", admin.from("village_blog_posts").select("*").eq("author_id", uid)),
    pobierz(uwagi, "village_history_entries", admin.from("village_history_entries").select("*").eq("author_id", uid)),
    pobierz(uwagi, "marketplace_profiles", admin.from("marketplace_profiles").select("*").eq("owner_user_id", uid)),
    pobierz(uwagi, "marketplace_listings", admin.from("marketplace_listings").select("*").eq("owner_user_id", uid)),
    pobierz(uwagi, "local_news_items", admin.from("local_news_items").select("*").eq("created_by", uid)),
    pobierz(uwagi, "village_shopping_list_items", admin.from("village_shopping_list_items").select("*").eq("created_by", uid)),
    pobierz(uwagi, "village_weekly_schedule_slots", admin.from("village_weekly_schedule_slots").select("*").eq("created_by", uid)),
    pobierz(uwagi, "village_funding_sources", admin.from("village_funding_sources").select("*").eq("created_by", uid)),
    pobierz(uwagi, "village_community_groups", admin.from("village_community_groups").select("*").eq("created_by", uid)),
    pobierz(
      uwagi,
      "village_community_events",
      admin.from("village_community_events").select("*").or(`created_by.eq.${uid},moderated_by.eq.${uid}`)
    ),
    pobierz(uwagi, "village_official_contacts", admin.from("village_official_contacts").select("*").or(orOfficialContacts)),
    pobierz(uwagi, "village_official_terms", admin.from("village_official_terms").select("*").eq("created_by", uid)),
    pobierz(uwagi, "village_civic_guides", admin.from("village_civic_guides").select("*").eq("updated_by", uid)),
    pobierz(uwagi, "entities", admin.from("entities").select("*").eq("approved_by", uid)),
  ]);

  meta.uwagi_eksportu = uwagi;

  return {
    meta,
    konto_auth,
    users,
    user_village_roles,
    user_follows,
    user_web_push_subscriptions,
    user_transport_favorite_relations,
    posts,
    comments,
    notifications,
    entity_representatives,
    hall_bookings_jako_rezerwujacy_lub_akceptujacy,
    issues_jako_zglaszajacy_lub_przypisany,
    photo_albums,
    photos,
    moderation_reports,
    audit_log,
    village_bloggers,
    village_blog_posts,
    village_history_entries,
    marketplace_profiles,
    marketplace_listings,
    local_news_items,
    village_shopping_list_items,
    village_weekly_schedule_slots,
    village_funding_sources,
    village_community_groups,
    village_community_events,
    village_official_contacts,
    village_official_terms,
    village_civic_guides,
    entities_zatwierdzone_przez_uzytkownika,
  };
}
