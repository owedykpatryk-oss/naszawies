import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

type WpisSubskrypcji = {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
};

let vapidUstawiony = false;

function czyVapidSkonfigurowany(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  return Boolean(pub && priv);
}

function upewnijVapid(): void {
  if (vapidUstawiony) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY!.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:kontakt@naszawies.pl";
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidUstawiony = true;
}

function payloadJson(params: {
  title: string;
  body: string;
  linkUrl: string;
  tag?: string;
}): string {
  return JSON.stringify({
    title: params.title,
    body: params.body,
    link_url: params.linkUrl,
    ...(params.tag ? { tag: params.tag } : {}),
  });
}

async function usunWygaslaSubskrypcje(admin: SupabaseClient, id: string): Promise<void> {
  await admin.from("user_web_push_subscriptions").delete().eq("id", id);
}

/**
 * Wysyła Web Push do wszystkich zapisanych urządzeń użytkownika (VAPID + web-push).
 * Przy 410/404 usuwa subskrypcję z bazy. Bez kluczy VAPID — no-op.
 */
export async function wyslijWebPushDlaUzytkownika(
  admin: SupabaseClient,
  params: {
    userId: string;
    title: string;
    body: string;
    linkUrl?: string | null;
    tag?: string;
  },
): Promise<void> {
  if (!czyVapidSkonfigurowany()) return;
  upewnijVapid();

  const { data: subs, error } = await admin
    .from("user_web_push_subscriptions")
    .select("id, user_id, endpoint, keys_p256dh, keys_auth")
    .eq("user_id", params.userId);

  if (error || !subs?.length) {
    if (error) console.warn("[web-push] odczyt subskrypcji:", error.message);
    return;
  }

  await wyslijDoListySubskrypcji(admin, subs as WpisSubskrypcji[], params);
}

/**
 * Jedna treść push do wielu użytkowników (np. sołtysi po sync RSS).
 */
export async function wyslijWebPushDoWieluOdbiorcow(
  admin: SupabaseClient,
  userIds: string[],
  wiadomosc: {
    title: string;
    body: string;
    linkUrl?: string | null;
    tag?: string;
  },
): Promise<void> {
  if (!czyVapidSkonfigurowany()) return;
  const unikalne = Array.from(new Set(userIds.filter(Boolean)));
  if (!unikalne.length) return;
  upewnijVapid();

  const { data: subs, error } = await admin
    .from("user_web_push_subscriptions")
    .select("id, user_id, endpoint, keys_p256dh, keys_auth")
    .in("user_id", unikalne);

  if (error || !subs?.length) {
    if (error) console.warn("[web-push] odczyt subskrypcji (wielu):", error.message);
    return;
  }

  const linkDomyslny = wiadomosc.linkUrl?.trim() || "/panel/powiadomienia";
  const json = payloadJson({
    title: wiadomosc.title,
    body: wiadomosc.body,
    linkUrl: linkDomyslny,
    tag: wiadomosc.tag,
  });

  for (const s of subs as WpisSubskrypcji[]) {
    await wyslijJeden(admin, s, json);
  }
}

async function wyslijDoListySubskrypcji(
  admin: SupabaseClient,
  subs: WpisSubskrypcji[],
  params: { title: string; body: string; linkUrl?: string | null; tag?: string },
): Promise<void> {
  const linkDomyslny = params.linkUrl?.trim() || "/panel/powiadomienia";
  const json = payloadJson({
    title: params.title,
    body: params.body,
    linkUrl: linkDomyslny,
    tag: params.tag,
  });
  for (const s of subs) {
    await wyslijJeden(admin, s, json);
  }
}

async function wyslijJeden(admin: SupabaseClient, s: WpisSubskrypcji, json: string): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: s.endpoint,
        keys: { p256dh: s.keys_p256dh, auth: s.keys_auth },
      },
      json,
      { TTL: 86_400 },
    );
  } catch (err: unknown) {
    const status =
      typeof err === "object" && err !== null && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    if (status === 410 || status === 404) {
      await usunWygaslaSubskrypcje(admin, s.id);
    } else {
      console.warn("[web-push] wysyłka:", status, err instanceof Error ? err.message : err);
    }
  }
}
