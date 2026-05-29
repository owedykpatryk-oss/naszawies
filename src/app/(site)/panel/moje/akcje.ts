"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export type WynikProsty = { ok: true; komunikat?: string } | { blad: string };

const sciezkiMoje = ["/panel/moje", "/panel/mieszkaniec"] as const;

function odswiezMoje() {
  for (const p of sciezkiMoje) {
    revalidatePath(p);
  }
}

const uuid = z.string().uuid();

export async function przestanObserwowacWies(followId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(followId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator obserwacji." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase.from("user_follows").delete().eq("id", id.data).eq("user_id", user.id);

  if (error) {
    console.error("[przestanObserwowacWies]", error.message);
    return { blad: "Nie udało się usunąć z ulubionych." };
  }

  odswiezMoje();
  return { ok: true, komunikat: "Usunięto z obserwowanych." };
}

export async function obserwujGmine(
  voivodeship: string,
  county: string,
  commune: string,
): Promise<WynikProsty> {
  const woj = voivodeship.trim();
  const pow = county.trim();
  const gmi = commune.trim();
  if (!woj || !pow || !gmi) {
    return { blad: "Podaj pełne dane gminy." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase.from("user_commune_follows").insert({
    user_id: user.id,
    voivodeship: woj,
    county: pow,
    commune: gmi,
  });

  if (error) {
    if (error.code === "23505") {
      return { blad: "Ta gmina jest już na liście obserwowanych." };
    }
    console.error("[obserwujGmine]", error.message);
    return { blad: "Nie udało się dodać gminy do obserwowanych." };
  }

  odswiezMoje();
  return { ok: true, komunikat: `Obserwujesz gminę ${gmi}.` };
}

export async function przestanObserwowacGmine(followId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(followId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase
    .from("user_commune_follows")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("[przestanObserwowacGmine]", error.message);
    return { blad: "Nie udało się usunąć obserwacji gminy." };
  }

  odswiezMoje();
  return { ok: true, komunikat: "Usunięto obserwację gminy." };
}

const typTresci = z.enum(["post", "event", "listing"]);

export async function zapiszTresc(input: {
  villageId: string;
  contentType: "post" | "event" | "listing";
  contentId: string;
  title: string;
  href: string;
}): Promise<WynikProsty & { id?: string }> {
  const vId = uuid.safeParse(input.villageId);
  const cId = uuid.safeParse(input.contentId);
  const typ = typTresci.safeParse(input.contentType);
  const title = input.title.trim().slice(0, 300);
  const href = input.href.trim().slice(0, 500);
  if (!vId.success || !cId.success || !typ.success || !title || !href.startsWith("/")) {
    return { blad: "Niepoprawne dane zapisu." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data, error } = await supabase
    .from("user_saved_content")
    .insert({
      user_id: user.id,
      village_id: vId.data,
      content_type: typ.data,
      content_id: cId.data,
      title_cache: title,
      href_cache: href,
      ...(typ.data === "listing"
        ? await (async () => {
            const { data: ogl } = await supabase
              .from("marketplace_listings")
              .select("price_amount")
              .eq("id", cId.data)
              .maybeSingle();
            return {
              price_snapshot: ogl?.price_amount ?? null,
              watch_price: true,
            };
          })()
        : {}),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { blad: "Ta treść jest już w ulubionych." };
    }
    console.error("[zapiszTresc]", error.message);
    return { blad: "Nie udało się zapisać." };
  }

  odswiezMoje();
  const komunikat =
    typ.data === "listing"
      ? "Dodano do ulubionych — włączono obserwację ceny."
      : "Dodano do ulubionych.";
  return { ok: true, komunikat, id: data?.id };
}

export async function usunZapisanaTresc(savedId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(savedId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase.from("user_saved_content").delete().eq("id", id.data).eq("user_id", user.id);

  if (error) {
    console.error("[usunZapisanaTresc]", error.message);
    return { blad: "Nie udało się usunąć zapisu." };
  }

  odswiezMoje();
  return { ok: true, komunikat: "Usunięto z ulubionych." };
}

export async function ustawObserwacjeCenyOgloszenia(
  savedId: string,
  watchPrice: boolean,
): Promise<WynikProsty> {
  const id = uuid.safeParse(savedId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: row } = await supabase
    .from("user_saved_content")
    .select("id, content_type, content_id, price_snapshot")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row || row.content_type !== "listing") {
    return { blad: "Obserwacja ceny dotyczy tylko ogłoszeń na rynku." };
  }

  let priceSnapshot = row.price_snapshot;
  if (watchPrice && priceSnapshot == null) {
    const { data: ogl } = await supabase
      .from("marketplace_listings")
      .select("price_amount")
      .eq("id", row.content_id)
      .maybeSingle();
    priceSnapshot = ogl?.price_amount ?? null;
  }

  const { error } = await supabase
    .from("user_saved_content")
    .update({
      watch_price: watchPrice,
      ...(watchPrice ? { price_snapshot: priceSnapshot } : {}),
    })
    .eq("id", id.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("[ustawObserwacjeCenyOgloszenia]", error.message);
    return { blad: "Nie udało się zapisać ustawienia." };
  }

  odswiezMoje();
  return {
    ok: true,
    komunikat: watchPrice ? "Włączono obserwację ceny." : "Wyłączono obserwację ceny.",
  };
}
