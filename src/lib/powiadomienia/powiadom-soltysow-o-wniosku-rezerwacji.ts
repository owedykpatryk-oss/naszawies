import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";

/** Po złożeniu wniosku o rezerwację sali — powiadamia sołtysów / współadminów wsi. */
export async function powiadomSoltysowONowymWnioskuRezerwacji(
  admin: SupabaseClient,
  params: {
    villageId: string;
    hallId: string;
    bookingId: string;
    applicantUserId: string;
    startAt: string;
    endAt: string;
    eventType: string;
    eventTitle: string | null;
  },
): Promise<void> {
  const { data: applicant, error: eUser } = await admin
    .from("users")
    .select("display_name")
    .eq("id", params.applicantUserId)
    .maybeSingle();
  if (eUser) {
    console.warn("[powiadom wniosek rezerwacji] users:", eUser.message);
  }
  const nazwa =
    typeof applicant?.display_name === "string" && applicant.display_name.trim().length > 0
      ? applicant.display_name.trim()
      : "Mieszkaniec";

  const { data: roleRows, error: e1 } = await admin
    .from("user_village_roles")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);
  if (e1) {
    console.warn("[powiadom wniosek rezerwacji] role:", e1.message);
    return;
  }

  const odbiorcy = new Set<string>();
  for (const r of roleRows ?? []) {
    const uid = r.user_id as string | undefined;
    if (uid && uid !== params.applicantUserId) odbiorcy.add(uid);
  }
  if (odbiorcy.size === 0) return;

  const tStart = new Date(params.startAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  const tKoniec = new Date(params.endAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  const wydarzenie = params.eventTitle?.trim()
    ? `${params.eventType} — ${params.eventTitle.trim()}`
    : params.eventType;

  const tytul = "Nowy wniosek o rezerwację sali";
  const body = `${nazwa}: ${wydarzenie}, ${tStart} – ${tKoniec}.`;
  const linkUrl = "/panel/soltys/rezerwacje";

  const wstaw = Array.from(odbiorcy).map((user_id) => ({
    user_id,
    type: "hall_booking_submitted",
    title: tytul,
    body,
    link_url: linkUrl,
    related_id: params.bookingId,
    related_type: "hall_booking" as const,
    channel: "in_app" as const,
  }));

  const { error: ins } = await admin.from("notifications").insert(wstaw);
  if (ins) {
    console.warn("[powiadom wniosek rezerwacji] insert:", ins.message);
    return;
  }

  void wyslijWebPushDoWieluOdbiorcow(admin, Array.from(odbiorcy), {
    title: tytul,
    body: body.length > 110 ? `${body.slice(0, 110)}…` : body,
    linkUrl,
    tag: `hall-booking-submitted-${params.hallId}`,
  }).catch((e) => console.warn("[web-push wniosek rezerwacji]", e));
}

/** Po anulowaniu wniosku pending — informuje sołtysów. */
export async function powiadomSoltysowOAnulowaniuRezerwacji(
  admin: SupabaseClient,
  params: {
    villageId: string;
    hallId: string;
    applicantUserId: string;
    startAt: string;
  },
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
    if (uid && uid !== params.applicantUserId) odbiorcy.add(uid);
  }
  if (odbiorcy.size === 0) return;

  const tStart = new Date(params.startAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  const tytul = "Anulowano wniosek o rezerwację sali";
  const body = `Mieszkaniec wycofał wniosek na termin ${tStart}.`;

  await admin.from("notifications").insert(
    Array.from(odbiorcy).map((user_id) => ({
      user_id,
      type: "hall_booking_cancelled",
      title: tytul,
      body,
      link_url: "/panel/soltys/rezerwacje",
      related_id: params.hallId,
      related_type: "hall" as const,
      channel: "in_app" as const,
    })),
  );
}
