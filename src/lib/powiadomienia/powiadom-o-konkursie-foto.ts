import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";

/** Powiadom obserwujących wieś o otwarciu głosowania w konkursie zdjęć. */
export async function powiadomOGlosowaniuWKonkursieFoto(opts: {
  villageId: string;
  contestId: string;
  title: string;
  sciezkaProfilu: string;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const odbiorcy = await pobierzObserwujacychWydarzenia(admin, opts.villageId);
  if (odbiorcy.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://naszawies.pl";
  const linkPelny = opts.sciezkaProfilu.startsWith("http")
    ? opts.sciezkaProfilu
    : `${baseUrl}${opts.sciezkaProfilu}`;

  const tytul = "Głosowanie w konkursie zdjęć";
  const tresc = `Sołtys otworzył głosowanie: „${opts.title}”. Oddaj głos na profilu wsi.`;

  const wstaw = odbiorcy.map((user_id) => ({
    user_id,
    type: "photo_contest_voting_open",
    title: tytul,
    body: tresc,
    link_url: linkPelny,
    related_id: opts.contestId,
    related_type: "photo_contest",
    channel: "in_app" as const,
  }));

  const { error } = await admin.from("notifications").insert(wstaw);
  if (error) {
    console.warn("[powiadomOGlosowaniuWKonkursieFoto]", error.message);
  }

  void wyslijWebPushDoWieluOdbiorcow(admin, odbiorcy, {
    title: tytul,
    body: tresc,
    linkUrl: `${linkPelny}#konkurs-foto-wsi`,
    tag: `contest-vote-${opts.contestId}`,
  }).catch((e) => console.warn("[web-push konkurs]", e));
}

async function pobierzObserwujacychWydarzenia(
  admin: SupabaseClient,
  villageId: string,
): Promise<string[]> {
  const { data, error } = await admin
    .from("user_follows")
    .select("user_id")
    .eq("village_id", villageId)
    .eq("notify_events", true);
  if (error) return [];
  return (data ?? []).map((r) => r.user_id as string).filter(Boolean);
}
