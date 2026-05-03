import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";

/**
 * Po złożeniu wniosku o rolę (mieszkaniec lub rola organizacyjna): powiadamia aktywnych sołtysów / współadminów.
 * Wymaga klienta service role (insert `notifications` „do obcych”).
 */
export async function powiadomSoltysowONowymWnioskuRoli(
  admin: SupabaseClient,
  params: {
    villageId: string;
    applicantUserId: string;
    rolaEtykieta: string;
  },
): Promise<void> {
  const { data: applicant, error: eUser } = await admin
    .from("users")
    .select("display_name")
    .eq("id", params.applicantUserId)
    .maybeSingle();
  if (eUser) {
    console.warn("[powiadom wniosek roli] users:", eUser.message);
  }
  const nazwa =
    typeof applicant?.display_name === "string" && applicant.display_name.trim().length > 0
      ? applicant.display_name.trim()
      : "Użytkownik";

  const { data: roleRows, error: e1 } = await admin
    .from("user_village_roles")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);
  if (e1) {
    console.warn("[powiadom wniosek roli] role:", e1.message);
    return;
  }

  const odbiorcy = new Set<string>();
  for (const r of roleRows ?? []) {
    const uid = r.user_id as string | undefined;
    if (uid && uid !== params.applicantUserId) odbiorcy.add(uid);
  }
  if (odbiorcy.size === 0) return;

  const tytul = "Nowy wniosek o rolę we wsi";
  const body = `${nazwa} — wniosek: ${params.rolaEtykieta}.`;
  const wstaw = Array.from(odbiorcy).map((user_id) => ({
    user_id,
    type: "role_application_submitted",
    title: tytul,
    body,
    link_url: "/panel/soltys",
    related_id: params.villageId,
    related_type: "village" as const,
    channel: "in_app" as const,
  }));

  const { error: ins } = await admin.from("notifications").insert(wstaw);
  if (ins) {
    console.warn("[powiadom wniosek roli] insert:", ins.message);
    return;
  }

  void wyslijWebPushDoWieluOdbiorcow(admin, Array.from(odbiorcy), {
    title: tytul,
    body: body.length > 110 ? `${body.slice(0, 110)}…` : body,
    linkUrl: "/panel/soltys",
    tag: `role-application-${params.villageId}`,
  }).catch((e) => console.warn("[web-push wniosek roli]", e));
}
