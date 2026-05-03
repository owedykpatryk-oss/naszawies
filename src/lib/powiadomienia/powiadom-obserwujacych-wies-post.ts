import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";

type KanalObserwacji = "posts" | "events" | "issues" | "alerts";

/** Mapowanie typu posta z bazy na przełącznik `user_follows.notify_*`. */
export function kanalPowiadomieniaDlaTypuPosta(typPosta: string): KanalObserwacji {
  if (typPosta === "wydarzenie" || typPosta === "zebranie") {
    return "events";
  }
  if (typPosta === "awaria") {
    return "issues";
  }
  return "posts";
}

function kolumnaNotify(kanal: KanalObserwacji): "notify_posts" | "notify_events" | "notify_issues" | "notify_alerts" {
  switch (kanal) {
    case "events":
      return "notify_events";
    case "issues":
      return "notify_issues";
    case "alerts":
      return "notify_alerts";
    default:
      return "notify_posts";
  }
}

async function pobierzUserIdsObserwujacych(
  admin: SupabaseClient,
  villageId: string,
  kanal: KanalObserwacji,
  wykluczUserId: string | null,
  typPosta: string
): Promise<string[]> {
  let query = admin.from("user_follows").select("user_id").eq("village_id", villageId);
  if (typPosta === "awaria") {
    query = query.or("notify_issues.eq.true,notify_alerts.eq.true");
  } else {
    const kol = kolumnaNotify(kanal);
    query = query.eq(kol, true);
  }
  const { data, error } = await query;
  if (error) {
    console.warn("[obserwujacy wsi] odczyt user_follows:", error.message);
    return [];
  }
  const wynik = new Set<string>();
  for (const w of data ?? []) {
    const uid = w.user_id as string | undefined;
    if (!uid || uid === wykluczUserId) continue;
    wynik.add(uid);
  }
  return Array.from(wynik);
}

/**
 * Powiadamia użytkowników obserwujących wieś (bez roli — tylko `user_follows`), gdy sołtys opublikuje post.
 * Wymaga klienta service role — zwykła sesja nie wstawi powiadomień „obcym” użytkownikom przez obecną politykę RLS.
 */
export async function powiadomObserwujacychOOpublikowanyPost(
  admin: SupabaseClient,
  params: {
    villageId: string;
    postId: string;
    postType: string;
    title: string;
    linkUrlPelny: string;
    excludeUserId?: string | null;
  }
): Promise<void> {
  const kanal = kanalPowiadomieniaDlaTypuPosta(params.postType);
  const userIds = await pobierzUserIdsObserwujacych(
    admin,
    params.villageId,
    kanal,
    params.excludeUserId ?? null,
    params.postType
  );
  if (userIds.length === 0) return;

  const tytul = "Nowy wpis na tablicy obserwowanej wsi";
  const body =
    params.title.length > 160 ? `${params.title.slice(0, 160)}…` : params.title;

  const wstaw = userIds.map((user_id) => ({
    user_id,
    type: "followed_village_post",
    title: tytul,
    body,
    link_url: params.linkUrlPelny,
    related_id: params.postId,
    related_type: "post",
    channel: "in_app" as const,
  }));

  const { error } = await admin.from("notifications").insert(wstaw);
  if (error) {
    console.warn("[powiadomObserwujacychOOpublikowanyPost]", error.message);
    return;
  }

  void wyslijWebPushDoWieluOdbiorcow(admin, userIds, {
    title: tytul,
    body,
    linkUrl: params.linkUrlPelny,
    tag: `follow-post-${params.postId}`,
  }).catch((e) => console.warn("[web-push obserwujacy]", e));
}
