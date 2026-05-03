import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

/**
 * Po zmianie statusu zgłoszenia przez sołtysa: inni sołtysi/współadmini oraz obserwujący (notify_issues).
 * Wymaga service role — obserwujący często nie mają wiersza w `user_village_roles`, więc RLS insert z sesji sołtysa by zawiódł.
 */
export async function powiadomObserwujacychISoltysowOZmianieStatusuZgloszenia(
  admin: SupabaseClient,
  params: {
    villageId: string;
    issueId: string;
    issueTitle: string;
    statusLabel: string;
    reporterUserId: string | null | undefined;
    /** Użytkownik, który właśnie zmienił status — bez powiadomienia „do siebie”. */
    actorUserId: string;
  }
): Promise<void> {
  const { data: wies, error: e0 } = await admin
    .from("villages")
    .select("slug, voivodeship, county, commune")
    .eq("id", params.villageId)
    .maybeSingle();
  if (e0) {
    console.warn("[powiadom status zgloszenia] villages:", e0.message);
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
    console.warn("[powiadom status zgloszenia] role:", e1.message);
    return;
  }

  const { data: followRows, error: e2 } = await admin
    .from("user_follows")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("notify_issues", true);
  if (e2) {
    console.warn("[powiadom status zgloszenia] follows:", e2.message);
    return;
  }

  const reporter = params.reporterUserId ?? null;
  const soltysi = new Set<string>();
  for (const r of roleRows ?? []) {
    const uid = r.user_id as string | undefined;
    if (!uid || uid === params.actorUserId) continue;
    if (reporter && uid === reporter) continue;
    soltysi.add(uid);
  }

  const obserwujacy = new Set<string>();
  for (const r of followRows ?? []) {
    const uid = r.user_id as string | undefined;
    if (!uid || uid === params.actorUserId) continue;
    if (reporter && uid === reporter) continue;
    if (soltysi.has(uid)) continue;
    obserwujacy.add(uid);
  }

  const tytul = "Zgłoszenie: zmiana statusu";
  const t = params.issueTitle.trim();
  const skrot = t.length > 120 ? `${t.slice(0, 120)}…` : t;
  const body = skrot ? `„${skrot}” — ${params.statusLabel}` : params.statusLabel;

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

  for (const uid of Array.from(soltysi)) {
    wstaw.push({
      user_id: uid,
      type: "issue_status_updated_soltys",
      title: tytul,
      body,
      link_url: "/panel/soltys/zgloszenia",
      related_id: params.villageId,
      related_type: "village",
      channel: "in_app",
    });
  }

  for (const uid of Array.from(obserwujacy)) {
    wstaw.push({
      user_id: uid,
      type: "issue_status_updated_follower",
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
    console.warn("[powiadom status zgloszenia] insert:", ins.message);
    return;
  }

  const unikalni = Array.from(new Set([...Array.from(soltysi), ...Array.from(obserwujacy)]));
  void wyslijWebPushDoWieluOdbiorcow(admin, unikalni, {
    title: tytul,
    body: body.length > 110 ? `${body.slice(0, 110)}…` : body,
    linkUrl: "/panel/powiadomienia",
    tag: `issue-status-village-${params.villageId}-${params.issueId}`,
  }).catch((e) => console.warn("[web-push status zgloszenia]", e));
}
