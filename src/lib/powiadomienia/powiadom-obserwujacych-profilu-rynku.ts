import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type WiesSciezka = {
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

/** Powiadomienie dla osób obserwujących profil firmy / sklepu — nowa lub ponownie aktywna oferta. */
export async function powiadomObserwujacychProfiluRynkuOOgloszeniu(input: {
  listingId: string;
  profileId: string;
  villageId: string;
  title: string;
  businessName: string;
  ownerUserId: string;
  wies: WiesSciezka | null;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const { data: obserwujacy } = await admin
    .from("marketplace_profile_follows")
    .select("user_id")
    .eq("profile_id", input.profileId)
    .eq("notify_new_listings", true);

  const odbiorcy = (obserwujacy ?? [])
    .map((r) => r.user_id)
    .filter((uid) => uid && uid !== input.ownerUserId);

  if (odbiorcy.length === 0) return;

  const linkProfil =
    input.wies?.slug != null
      ? `${sciezkaProfiluWsi(input.wies)}/rynek/firmy/${input.profileId}`
      : "/panel/moje/firmy";

  const linkOferta =
    input.wies?.slug != null
      ? `${sciezkaProfiluWsi(input.wies)}/rynek/${input.listingId}`
      : linkProfil;

  const tytul = `Nowa oferta: ${input.businessName}`;
  const tresc = `„${input.title}” — profil, który obserwujesz${input.wies?.name ? ` we wsi ${input.wies.name}` : ""}.`;

  const wiersze = odbiorcy.map((userId) => ({
    user_id: userId,
    type: "marketplace_profile_new_listing",
    title: tytul,
    body: tresc,
    link_url: linkOferta,
    related_id: input.listingId,
    related_type: "marketplace_listing",
    channel: "in_app",
  }));

  const { error } = await admin.from("notifications").insert(wiersze);
  if (error) {
    console.warn("[powiadomObserwujacychProfiluRynkuOOgloszeniu]", error.message);
    return;
  }

  for (const userId of odbiorcy) {
    void wyslijWebPushDlaUzytkownika(admin, {
      userId,
      title: tytul,
      body: tresc.slice(0, 180),
      linkUrl: linkOferta,
      tag: `profil-rynku-${input.profileId}-${input.listingId}`,
    }).catch((e) => console.warn("[web-push profil rynku]", e));
  }
}
