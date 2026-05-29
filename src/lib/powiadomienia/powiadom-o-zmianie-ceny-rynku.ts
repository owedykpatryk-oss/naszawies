import { etykietaJednostkiCeny } from "@/lib/marketplace/kategorie-ogloszen";
import { zaplanujPowiadomienieEmail } from "@/lib/email/zaplanuj-powiadomienie-email";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

function formatujCene(kwota: number | null, jednostka: string | null, waluta: string | null): string {
  if (kwota == null) return "cena do ustalenia";
  const j = jednostka ? ` ${etykietaJednostkiCeny(jednostka)}` : "";
  return `${kwota} ${waluta ?? "PLN"}${j}`;
}

function cenyRozne(a: number | null | undefined, b: number | null | undefined): boolean {
  const na = a == null ? null : Number(a);
  const nb = b == null ? null : Number(b);
  if (na === null && nb === null) return false;
  if (na === null || nb === null) return true;
  return Math.abs(na - nb) > 0.001;
}

export async function powiadomObserwujacychZmianeCenyOgloszenia(input: {
  listingId: string;
  villageId: string;
  title: string;
  newPrice: number | null;
  priceUnit: string | null;
  currency: string | null;
  ownerUserId: string;
  wies: { voivodeship: string; county: string; commune: string; slug: string };
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const { data: obserwujacy } = await admin
    .from("user_saved_content")
    .select("id, user_id, price_snapshot")
    .eq("content_type", "listing")
    .eq("content_id", input.listingId)
    .eq("watch_price", true);

  if (!obserwujacy?.length) return;

  const link = `${sciezkaProfiluWsi(input.wies)}/rynek/${input.listingId}`;
  const nowaCenaTekst = formatujCene(input.newPrice, input.priceUnit, input.currency);
  const tytul = "Zmiana ceny ogłoszenia";

  for (const w of obserwujacy) {
    if (w.user_id === input.ownerUserId) continue;
    if (!cenyRozne(w.price_snapshot, input.newPrice)) continue;

    const staraCenaTekst = formatujCene(
      w.price_snapshot != null ? Number(w.price_snapshot) : null,
      input.priceUnit,
      input.currency,
    );
    const body = `${input.title.slice(0, 100)} — teraz ${nowaCenaTekst}`;

    const { error } = await admin.from("notifications").insert({
      user_id: w.user_id,
      type: "marketplace_listing_price",
      title: tytul,
      body,
      link_url: link,
      related_id: input.listingId,
      related_type: "marketplace_listing",
      channel: "in_app",
    });
    if (error) console.warn("[powiadomZmianeCeny]", error.message);

    void wyslijWebPushDlaUzytkownika(admin, {
      userId: w.user_id,
      title: tytul,
      body,
      linkUrl: link,
      tag: `marketplace-price-${input.listingId}`,
    }).catch(() => {});

    zaplanujPowiadomienieEmail(w.user_id, `${tytul} · Naszawies`, tytul, [
      `Cena ogłoszenia „${input.title}” się zmieniła.`,
      `Było: ${staraCenaTekst}`,
      `Jest: ${nowaCenaTekst}`,
      "Wejdź na stronę ogłoszenia, aby zobaczyć szczegóły.",
    ]);

    await admin
      .from("user_saved_content")
      .update({ price_snapshot: input.newPrice })
      .eq("id", w.id);
  }
}
