import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { etykietaKategoriiOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export async function powiadomSubskrybentowNowegoOgloszenia(input: {
  listingId: string;
  villageId: string;
  title: string;
  equipmentCategory: string | null;
  ownerUserId: string;
  wies: { voivodeship: string; county: string; commune: string; slug: string };
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const kat = input.equipmentCategory ?? "";
  const { data: subskrypcje } = await admin
    .from("marketplace_category_subscriptions")
    .select("user_id, equipment_category")
    .eq("village_id", input.villageId);

  const odbiorcy = new Set<string>();
  for (const s of subskrypcje ?? []) {
    if (s.user_id === input.ownerUserId) continue;
    const pasuje = !s.equipment_category || s.equipment_category === kat;
    if (pasuje) odbiorcy.add(s.user_id);
  }

  if (odbiorcy.size === 0) return;

  const etykietaKat = kat ? etykietaKategoriiOgloszenia(kat) : "Rynek lokalny";
  const link = `${sciezkaProfiluWsi(input.wies)}/rynek/${input.listingId}`;
  const tytul = `Nowe ogłoszenie: ${etykietaKat}`;
  const body = input.title.slice(0, 180);

  const wstaw = Array.from(odbiorcy).map((userId) => ({
    user_id: userId,
    type: "marketplace_listing_new",
    title: tytul,
    body,
    link_url: link,
    related_id: input.listingId,
    related_type: "marketplace_listing",
    channel: "in_app",
  }));

  const { error } = await admin.from("notifications").insert(wstaw);
  if (error) console.warn("[powiadomSubskrybentow]", error.message);

  for (const userId of Array.from(odbiorcy)) {
    void wyslijWebPushDlaUzytkownika(admin, {
      userId,
      title: tytul,
      body,
      linkUrl: link,
      tag: `marketplace-new-${input.listingId}`,
    }).catch(() => {});
  }
}
