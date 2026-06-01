import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

/** Sołtysowie — nowe wspomnienie do akceptacji. */
export async function powiadomSoltysowOWspomnieniuHistorii(
  admin: SupabaseClient,
  params: { villageId: string; nazwaWsi: string; tytul: string; authorId: string },
): Promise<void> {
  const { data: roleRows } = await admin
    .from("user_village_roles")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);

  const odbiorcy = new Set<string>();
  for (const r of roleRows ?? []) {
    const uid = r.user_id as string | undefined;
    if (uid && uid !== params.authorId) odbiorcy.add(uid);
  }
  if (odbiorcy.size === 0) return;

  const tytul = "Nowe wspomnienie w kronice";
  const body = `„${params.tytul.slice(0, 80)}” — ${params.nazwaWsi}. Zatwierdź w panelu kroniki.`;
  const linkUrl = "/panel/soltys/spolecznosc/historia";

  const wstaw = Array.from(odbiorcy).map((user_id) => ({
    user_id,
    type: "history_pending",
    title: tytul,
    body,
    link_url: linkUrl,
    related_id: params.villageId,
    related_type: "village" as const,
    channel: "in_app" as const,
  }));

  const { error } = await admin.from("notifications").insert(wstaw);
  if (error) console.warn("[powiadom historia pending]", error.message);

  void wyslijWebPushDoWieluOdbiorcow(admin, Array.from(odbiorcy), {
    title: tytul,
    body,
    linkUrl,
    tag: `history-pending-${params.villageId}`,
  }).catch((e) => console.warn("[web-push historia pending]", e));
}

/** Obserwujący wieś (notify_posts) — nowy opublikowany wpis. */
export async function powiadomObserwujacychONowejHistorii(params: {
  entryId: string;
  villageId: string;
  tytul: string;
  wies: { name: string; voivodeship: string; county: string; commune: string; slug: string };
  authorId: string;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const { data: follows } = await admin
    .from("user_follows")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("notify_posts", true);

  const odbiorcy = new Set<string>();
  for (const f of follows ?? []) {
    const uid = f.user_id as string;
    if (uid && uid !== params.authorId) odbiorcy.add(uid);
  }

  const { data: mieszkancy } = await admin
    .from("user_village_roles")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("status", "active")
    .eq("role", "mieszkaniec");

  for (const m of mieszkancy ?? []) {
    const uid = m.user_id as string;
    if (uid && uid !== params.authorId) odbiorcy.add(uid);
  }

  if (odbiorcy.size === 0) return;

  const sciezka = sciezkaProfiluWsi(params.wies);
  const link = `${sciezka}/historia/${params.entryId}`;
  const tytul = `Nowa kronika — ${params.wies.name}`;
  const body = params.tytul.slice(0, 120);

  const wstaw = Array.from(odbiorcy).map((user_id) => ({
    user_id,
    type: "history_new",
    title: tytul,
    body,
    link_url: link,
    related_id: params.entryId,
    related_type: "village_history_entry" as const,
    channel: "in_app" as const,
  }));

  const { error } = await admin.from("notifications").insert(wstaw);
  if (error) console.warn("[powiadom historia new]", error.message);

  void wyslijWebPushDoWieluOdbiorcow(admin, Array.from(odbiorcy), {
    title: tytul,
    body,
    linkUrl: link,
    tag: `history-new-${params.entryId}`,
  }).catch((e) => console.warn("[web-push historia new]", e));
}
