import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijPowiadomienieDoWielu } from "@/lib/powiadomienia/wyslij-powiadomienie";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";

async function pobierzOdbiorcowAlertu(
  admin: SupabaseClient,
  villageId: string,
): Promise<string[]> {
  const ids = new Set<string>();

  const [{ data: followers }, { data: residents }] = await Promise.all([
    admin
      .from("user_follows")
      .select("user_id")
      .eq("village_id", villageId)
      .or("notify_alerts.eq.true,notify_issues.eq.true"),
    admin
      .from("user_village_roles")
      .select("user_id")
      .eq("village_id", villageId)
      .eq("status", "active"),
  ]);

  for (const f of followers ?? []) {
    if (f.user_id) ids.add(f.user_id as string);
  }
  for (const r of residents ?? []) {
    if (r.user_id) ids.add(r.user_id as string);
  }

  return Array.from(ids);
}

/** Powiadamia obserwujących i mieszkańców o nowym alercie awarii. */
export async function powiadomONowymAlercie(
  admin: SupabaseClient,
  params: {
    villageId: string;
    alertId: string;
    title: string;
    body: string;
    linkUrl: string;
    wykluczUserId?: string | null;
  },
): Promise<void> {
  let odbiorcy = await pobierzOdbiorcowAlertu(admin, params.villageId);
  if (params.wykluczUserId) {
    odbiorcy = odbiorcy.filter((id) => id !== params.wykluczUserId);
  }
  if (odbiorcy.length === 0) return;

  await wyslijPowiadomienieDoWielu(admin, odbiorcy, {
    typ: "alert_awaria",
    tytul: params.title,
    tresc: params.body,
    linkUrl: params.linkUrl,
    relatedId: params.alertId,
    relatedType: "village_alert",
    pushNatychmiast: true,
    emailNatychmiast: true,
  });

  await wyslijWebPushDoWieluOdbiorcow(admin, odbiorcy, {
    title: params.title,
    body: params.body,
    linkUrl: params.linkUrl,
    tag: "alert_awaria",
  });
}
