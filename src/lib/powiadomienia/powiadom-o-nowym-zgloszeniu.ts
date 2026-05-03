import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

/**
 * Powiadamia aktywnych sołtysów / współadminów oraz obserwujących wieś (notify_issues),
 * gdy mieszkaniec doda zgłoszenie. Wymaga klienta service role (RLS blokuje insercje „obcym”).
 */
export async function powiadomSoltysowIObserwujacychONowymZgloszeniu(
  admin: SupabaseClient,
  params: {
    villageId: string;
    title: string;
    reporterUserId: string;
  }
): Promise<void> {
  const { data: wies, error: e0 } = await admin
    .from("villages")
    .select("slug, voivodeship, county, commune")
    .eq("id", params.villageId)
    .maybeSingle();
  if (e0) {
    console.warn("[powiadom zgloszenie] villages:", e0.message);
  }
  const linkObserwator =
    wies?.slug && wies.voivodeship && wies.county && wies.commune
      ? sciezkaProfiluWsi({
          voivodeship: wies.voivodeship,
          county: wies.county,
          commune: wies.commune,
          slug: wies.slug,
        })
      : "/panel/mieszkaniec";

  const { data: roleRows, error: e1 } = await admin
    .from("user_village_roles")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);
  if (e1) {
    console.warn("[powiadom zgloszenie] role:", e1.message);
    return;
  }

  const { data: followRows, error: e2 } = await admin
    .from("user_follows")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("notify_issues", true);
  if (e2) {
    console.warn("[powiadom zgloszenie] follows:", e2.message);
    return;
  }

  const soltysi = new Set<string>();
  for (const r of roleRows ?? []) {
    const uid = r.user_id as string | undefined;
    if (uid && uid !== params.reporterUserId) soltysi.add(uid);
  }

  const obserwujacy = new Set<string>();
  for (const r of followRows ?? []) {
    const uid = r.user_id as string | undefined;
    if (uid && uid !== params.reporterUserId) obserwujacy.add(uid);
  }

  const wstaw: Array<{
    user_id: string;
    type: string;
    title: string;
    body: string;
    link_url: string;
    related_id: string;
    related_type: string;
    channel: "in_app";
  }> = [];

  const tytul = "Nowe zgłoszenie problemu";
  const body =
    params.title.length > 200 ? `${params.title.slice(0, 200)}…` : params.title;

  for (const uid of Array.from(soltysi)) {
    wstaw.push({
      user_id: uid,
      type: "issue_submitted",
      title: tytul,
      body,
      link_url: "/panel/soltys/zgloszenia",
      related_id: params.villageId,
      related_type: "village",
      channel: "in_app",
    });
  }

  for (const uid of Array.from(obserwujacy)) {
    if (soltysi.has(uid)) continue;
    wstaw.push({
      user_id: uid,
      type: "issue_submitted_follower",
      title: tytul,
      body,
      link_url: linkObserwator,
      related_id: params.villageId,
      related_type: "village",
      channel: "in_app",
    });
  }

  if (wstaw.length === 0) return;

  const { error: ins } = await admin.from("notifications").insert(wstaw);
  if (ins) {
    console.warn("[powiadom zgloszenie] insert:", ins.message);
    return;
  }

  const unikalni = Array.from(new Set([...Array.from(soltysi), ...Array.from(obserwujacy)]));
  void wyslijWebPushDoWieluOdbiorcow(admin, unikalni, {
    title: tytul,
    body,
    linkUrl: "/panel/powiadomienia",
    tag: `issue-new-${params.villageId}`,
  }).catch((e) => console.warn("[web-push zgloszenie]", e));
}
