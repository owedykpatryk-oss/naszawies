import { zaplanujPowiadomienieEmail } from "@/lib/email/zaplanuj-powiadomienie-email";
import { siteUrlDlaSzablonuEmail } from "@/lib/email/szablon-html-naszawies";
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
  nazwaWsi?: string | null;
  imageUrl?: string | null;
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
  const sciezkaRynek = sciezkaProfiluWsi(input.wies);
  const linkLista =
    kat && input.nazwaWsi
      ? `${sciezkaRynek}/rynek?kat=${encodeURIComponent(kat)}`
      : `${sciezkaRynek}/rynek/${input.listingId}`;
  const link = `${sciezkaRynek}/rynek/${input.listingId}`;
  const wiesTekst = input.nazwaWsi ? ` · ${input.nazwaWsi}` : "";
  const tytul = `Nowe ogłoszenie: ${etykietaKat}${wiesTekst}`;
  const body = input.title.slice(0, 160);

  const wstaw = Array.from(odbiorcy).map((userId) => ({
    user_id: userId,
    type: "marketplace_listing_new",
    title: tytul,
    body,
    link_url: linkLista,
    related_id: input.listingId,
    related_type: "marketplace_listing",
    channel: "in_app",
  }));

  const { error } = await admin.from("notifications").insert(wstaw);
  if (error) console.warn("[powiadomSubskrybentow]", error.message);

  const pelnyLink = `${siteUrlDlaSzablonuEmail()}${linkLista}`;
  const pelnyLinkOgloszenie = `${siteUrlDlaSzablonuEmail()}${link}`;

  for (const userId of Array.from(odbiorcy)) {
    void wyslijWebPushDlaUzytkownika(admin, {
      userId,
      title: tytul,
      body,
      linkUrl: linkLista,
      tag: `marketplace-new-${input.listingId}`,
      imageUrl: input.imageUrl ?? undefined,
    }).catch(() => {});

    zaplanujPowiadomienieEmail(userId, `${tytul} · Naszawies`, tytul, [
      input.nazwaWsi
        ? `Na rynku we wsi ${input.nazwaWsi} pojawiło się nowe ogłoszenie w kategorii „${etykietaKat}”.`
        : `Na rynku lokalnym pojawiło się nowe ogłoszenie w kategorii „${etykietaKat}”.`,
      input.title,
      `Zobacz kategorię: ${pelnyLink}`,
      `Bezpośrednio do ogłoszenia: ${pelnyLinkOgloszenie}`,
    ]);
  }
}
