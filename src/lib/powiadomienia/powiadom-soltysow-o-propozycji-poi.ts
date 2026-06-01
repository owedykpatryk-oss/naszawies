import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";

/** Powiadom aktywnych sołtysów / współadminów o nowej propozycji POI od mieszkańca. */
export async function powiadomSoltysowOPropozycjiPoi(
  admin: SupabaseClient,
  params: {
    villageId: string;
    nazwaPoi: string;
    nazwaWsi: string;
    proponentUserId: string;
  },
): Promise<void> {
  const { data: roleRows, error: e1 } = await admin
    .from("user_village_roles")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);
  if (e1) {
    console.warn("[powiadom propozycja poi] role:", e1.message);
    return;
  }

  const odbiorcy = new Set<string>();
  for (const r of roleRows ?? []) {
    const uid = r.user_id as string | undefined;
    if (uid && uid !== params.proponentUserId) odbiorcy.add(uid);
  }
  if (odbiorcy.size === 0) return;

  const tytul = "Propozycja punktu na mapie";
  const body = `„${params.nazwaPoi}” — ${params.nazwaWsi}. Zatwierdź w Moja wieś → propozycje.`;
  const linkUrl = "/panel/soltys/moja-wies#propozycje-poi";

  const wstaw = Array.from(odbiorcy).map((user_id) => ({
    user_id,
    type: "poi_proposal",
    title: tytul,
    body,
    link_url: linkUrl,
    related_id: params.villageId,
    related_type: "village" as const,
    channel: "in_app" as const,
  }));

  const { error: ins } = await admin.from("notifications").insert(wstaw);
  if (ins) {
    console.warn("[powiadom propozycja poi] insert:", ins.message);
    return;
  }

  void wyslijWebPushDoWieluOdbiorcow(admin, Array.from(odbiorcy), {
    title: tytul,
    body: body.length > 110 ? `${body.slice(0, 110)}…` : body,
    linkUrl,
    tag: `poi-proposal-${params.villageId}`,
  }).catch((e) => console.warn("[web-push poi proposal]", e));
}
