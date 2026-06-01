import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";
import { czyWydarzenieSportowe } from "@/lib/wies/sport";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

/** Obserwujący wieś — nowe wydarzenie sportowe (mecz, trening, wyjazd). */
export async function powiadomObserwujacychOWydarzeniuSportowym(params: {
  eventId: string;
  villageId: string;
  tytul: string;
  eventKind: string;
  nazwaGrupy: string | null;
  nazwyKlubow: string[];
  wies: { name: string; voivodeship: string; county: string; commune: string; slug: string };
  authorId: string;
}): Promise<void> {
  if (!czyWydarzenieSportowe(params.eventKind, params.nazwaGrupy, params.nazwyKlubow)) return;

  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const { data: follows } = await admin
    .from("user_follows")
    .select("user_id")
    .eq("village_id", params.villageId)
    .eq("notify_events", true);

  const odbiorcy = new Set<string>();
  for (const f of follows ?? []) {
    const uid = f.user_id as string;
    if (uid && uid !== params.authorId) odbiorcy.add(uid);
  }

  if (odbiorcy.size === 0) return;

  const sciezka = sciezkaProfiluWsi(params.wies);
  const link = `${sciezka}/wydarzenia/${params.eventId}`;
  const tytul = `Sport — ${params.wies.name}`;
  const body = params.tytul.slice(0, 120);

  const wstaw = Array.from(odbiorcy).map((user_id) => ({
    user_id,
    type: "sport_event_new",
    title: tytul,
    body,
    link_url: link,
    related_id: params.eventId,
    related_type: "village_community_event" as const,
    channel: "in_app" as const,
  }));

  const { error } = await admin.from("notifications").insert(wstaw);
  if (error) console.warn("[powiadom sport event]", error.message);

  void wyslijWebPushDoWieluOdbiorcow(admin, Array.from(odbiorcy), {
    title: tytul,
    body,
    linkUrl: link,
    tag: `sport-new-${params.eventId}`,
  }).catch((e) => console.warn("[web-push sport]", e));
}
