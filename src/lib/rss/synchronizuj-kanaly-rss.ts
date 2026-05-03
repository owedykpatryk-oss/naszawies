import type { SupabaseClient } from "@supabase/supabase-js";
import { sha256Hex } from "@/lib/krypto/sha256-hex";
import { wyslijWebPushDoWieluOdbiorcow } from "@/lib/pwa/wyslij-web-push";
import { parseRss2Items } from "@/lib/rss/parse-rss2";

export type WynikSyncRss = {
  zrodlaPrzetworzone: number;
  noweWpisy: number;
  bledy: string[];
};

async function powiadomSołtysowWsi(
  admin: SupabaseClient,
  villageId: string,
  tytul: string,
  tresc: string,
  linkUrl: string,
) {
  const { data: roleRows, error } = await admin
    .from("user_village_roles")
    .select("user_id")
    .eq("village_id", villageId)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);
  if (error || !roleRows?.length) return;
  const ids = Array.from(new Set(roleRows.map((r) => r.user_id).filter(Boolean)));
  const wstaw = ids.map((user_id) => ({
    user_id,
    type: "local_news_pending",
    title: tytul,
    body: tresc,
    link_url: linkUrl,
    related_id: villageId,
    related_type: "village",
    channel: "in_app" as const,
  }));
  const { error: bladNotif } = await admin.from("notifications").insert(wstaw);
  if (!bladNotif && ids.length > 0) {
    void wyslijWebPushDoWieluOdbiorcow(admin, ids, {
      title: tytul,
      body: tresc,
      linkUrl,
      tag: `local-news-rss-${villageId}`,
    }).catch((e) => console.warn("[web-push rss]", e));
  }
}

export async function synchronizujKanalyRssDlaWsi(
  admin: SupabaseClient,
  filtrVillageIds: string[] | null,
): Promise<WynikSyncRss> {
  const bledy: string[] = [];
  let zrodlaPrzetworzone = 0;
  let noweWpisy = 0;

  let q = admin.from("village_news_feed_sources").select("id, village_id, label, feed_url, is_enabled").eq("is_enabled", true);
  if (filtrVillageIds && filtrVillageIds.length > 0) {
    q = q.in("village_id", filtrVillageIds);
  }
  const { data: zrodla, error: zErr } = await q;
  if (zErr) {
    bledy.push(zErr.message);
    return { zrodlaPrzetworzone: 0, noweWpisy: 0, bledy };
  }

  const teraz = new Date();
  const expiresAt = new Date(teraz.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const wsiZNovymiWpisami = new Set<string>();

  for (const z of zrodla ?? []) {
    zrodlaPrzetworzone += 1;
    let lastErr: string | null = null;
    try {
      const res = await fetch(z.feed_url, {
        headers: { "User-Agent": "NaszawiesRSS/1.0 (+https://naszawies.pl)" },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        bledy.push(`${z.label}: ${lastErr}`);
      } else {
        const xml = await res.text();
        const items = parseRss2Items(xml);
        for (const it of items) {
          const hash = sha256Hex(`${z.village_id}:${it.guid}`);
          const { error: insErr } = await admin.from("local_news_items").insert({
            village_id: z.village_id,
            created_by: null,
            source_name: z.label,
            source_url: it.link || null,
            title: it.title.slice(0, 200),
            summary: it.description ? it.description.slice(0, 500) : null,
            body: it.description,
            category: "Z kanału RSS",
            is_automated: true,
            status: "pending",
            expires_at: expiresAt,
            external_guid_hash: hash,
          });
          if (insErr) {
            if (insErr.code !== "23505") {
              bledy.push(`${z.label} wpis: ${insErr.message}`);
            }
          } else {
            noweWpisy += 1;
            wsiZNovymiWpisami.add(z.village_id);
          }
        }
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      bledy.push(`${z.label}: ${lastErr}`);
    }

    await admin
      .from("village_news_feed_sources")
      .update({
        last_fetched_at: new Date().toISOString(),
        last_error: lastErr ?? null,
      })
      .eq("id", z.id);
  }

  for (const vid of Array.from(wsiZNovymiWpisami)) {
    await powiadomSołtysowWsi(
      admin,
      vid,
      "Nowe wiadomości z RSS",
      "Pojawiły się wpisy oczekujące na akceptację w module wiadomości lokalnych.",
      "/panel/soltys/wiadomosci-lokalne",
    );
  }

  return { zrodlaPrzetworzone, noweWpisy, bledy };
}
