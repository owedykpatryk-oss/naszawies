import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type WiesSciezka = {
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

export async function powiadomOStatusieOgloszeniaMarketplace(input: {
  ownerUserId: string;
  listingId: string;
  title: string;
  status: "approved" | "rejected";
  moderationNote?: string | null;
  wies?: WiesSciezka | null;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const linkRynek =
    input.wies?.slug && input.status === "approved"
      ? `${sciezkaProfiluWsi(input.wies)}/rynek/${input.listingId}`
      : "/panel/mieszkaniec/marketplace";

  const tytul =
    input.status === "approved"
      ? "Ogłoszenie zatwierdzone na rynku"
      : "Ogłoszenie odrzucone";

  const tresc =
    input.status === "approved"
      ? `„${input.title}” jest widoczne na profilu wsi.`
      : input.moderationNote?.trim()
        ? `„${input.title}” — ${input.moderationNote.trim()}`
        : `„${input.title}” nie zostało opublikowane. Popraw treść i dodaj ponownie.`;

  const typ = input.status === "approved" ? "marketplace_listing_approved" : "marketplace_listing_rejected";

  const { error } = await admin.from("notifications").insert({
    user_id: input.ownerUserId,
    type: typ,
    title: tytul,
    body: tresc,
    link_url: linkRynek,
    related_id: input.listingId,
    related_type: "marketplace_listing",
    channel: "in_app",
  });

  if (error) {
    console.warn("[powiadomOStatusieOgloszeniaMarketplace]", error.message);
    return;
  }

  void wyslijWebPushDlaUzytkownika(admin, {
    userId: input.ownerUserId,
    title: tytul,
    body: tresc.slice(0, 180),
    linkUrl: linkRynek,
    tag: `marketplace-${input.listingId}`,
  }).catch((e) => console.warn("[web-push marketplace]", e));
}
