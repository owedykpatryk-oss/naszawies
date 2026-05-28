import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

/** Przypomnienie 7 dni przed wygaśnięciem ogłoszenia (raz na ogłoszenie w oknie). */
export async function powiadomOWygasajacychOgloszeniachMarketplace(villageId?: string): Promise<number> {
  const admin = createAdminSupabaseClient();
  if (!admin) return 0;

  const teraz = new Date();
  const za7Dni = new Date(teraz);
  za7Dni.setDate(za7Dni.getDate() + 7);

  let zapytanie = admin
    .from("marketplace_listings")
    .select("id, title, owner_user_id, village_id, expires_at, villages(name, slug, voivodeship, county, commune)")
    .eq("status", "approved")
    .gte("expires_at", teraz.toISOString())
    .lte("expires_at", za7Dni.toISOString());

  if (villageId) {
    zapytanie = zapytanie.eq("village_id", villageId);
  }

  const { data: wiersze } = await zapytanie.limit(200);
  if (!wiersze?.length) return 0;

  let wyslane = 0;
  for (const o of wiersze) {
    const { data: istniejace } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", o.owner_user_id)
      .eq("related_id", o.id)
      .eq("type", "marketplace_listing_expiring")
      .gte("created_at", new Date(teraz.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (istniejace?.length) continue;

    const v = Array.isArray(o.villages) ? o.villages[0] : o.villages;
    const link =
      v && typeof v === "object" && "slug" in v
        ? `${sciezkaProfiluWsi(v as { voivodeship: string; county: string; commune: string; slug: string })}/rynek/${o.id}`
        : "/panel/mieszkaniec/marketplace";

    const dataWygasniecia = o.expires_at ? new Date(o.expires_at).toLocaleDateString("pl-PL") : "wkrótce";
    const tytul = "Ogłoszenie wkrótce wygaśnie";
    const tresc = `„${o.title}” — ważne do ${dataWygasniecia}. Przedłuż w panelu Rynku lokalnego.`;

    const { error } = await admin.from("notifications").insert({
      user_id: o.owner_user_id,
      type: "marketplace_listing_expiring",
      title: tytul,
      body: tresc,
      link_url: link,
      related_id: o.id,
      related_type: "marketplace_listing",
      channel: "in_app",
    });

    if (error) {
      console.warn("[powiadomOWygasajacychOgloszeniachMarketplace]", error.message);
      continue;
    }

    void wyslijWebPushDlaUzytkownika(admin, {
      userId: o.owner_user_id,
      title: tytul,
      body: tresc.slice(0, 180),
      linkUrl: link,
      tag: `marketplace-exp-${o.id}`,
    }).catch(() => {});

    wyslane += 1;
  }

  return wyslane;
}
