"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { R2_BUCKET_HALL_INVENTORY } from "@/lib/cloudflare/r2-bucket-znaczniki";
import { wyciagnijBucketIKluczZUrlaR2 } from "@/lib/cloudflare/r2-url-pomoc";
import { usunObiektR2JesliUrlNasz } from "@/lib/storage/usun-plik-r2-po-url";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { schemaPlanSali, type PlanSaliJson } from "@/lib/swietlica/plan-sali";

const uuid = z.string().uuid();

export type WynikProsty = { blad: string } | { ok: true };

export async function zatwierdzWniosekMieszkanca(rolaId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(rolaId);
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

  const { data: wiersz, error: readErr } = await supabase
    .from("user_village_roles")
    .select("user_id, village_id, status, role")
    .eq("id", id.data)
    .maybeSingle();

  if (readErr || !wiersz || wiersz.status !== "pending" || wiersz.role !== "mieszkaniec") {
    return { blad: "Nie znaleziono wniosku lub został już rozpatrzony." };
  }

  const { error: upErr } = await supabase
    .from("user_village_roles")
    .update({
      status: "active",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (upErr) {
    console.error("[zatwierdzWniosek]", upErr.message);
    return { blad: "Nie udało się zaakceptować (sprawdź, czy jesteś sołtysem tej wsi)." };
  }

  const { error: notifErr } = await supabase.from("notifications").insert({
    user_id: wiersz.user_id,
    type: "role_approved",
    title: "Zaakceptowano wniosek mieszkańca",
    body: "Twoja rola we wsi została aktywowana.",
    link_url: "/panel/mieszkaniec",
    related_id: wiersz.village_id,
    related_type: "village",
    channel: "in_app",
  });

  if (notifErr) {
    console.warn("[zatwierdzWniosek] powiadomienie:", notifErr.message);
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/mieszkaniec");
  revalidatePath("/panel/powiadomienia");
  return { ok: true };
}

export async function odrzucWniosekMieszkanca(rolaId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(rolaId);
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
    .from("user_village_roles")
    .update({ status: "suspended" })
    .eq("id", id.data)
    .eq("status", "pending")
    .eq("role", "mieszkaniec");

  if (error) {
    console.error("[odrzucWniosek]", error.message);
    return { blad: "Nie udało się odrzucić wniosku." };
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/mieszkaniec");
  return { ok: true };
}

const schemaWyposazenieDodaj = z.object({
  hallId: z.string().uuid(),
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99999),
  quantity_available: z.coerce.number().int().min(0).max(99999).nullable().optional(),
  condition: z.string().trim().max(50).optional().default("good"),
});

export async function dodajWyposazenieSwietlicy(
  dane: z.infer<typeof schemaWyposazenieDodaj>
): Promise<WynikProsty> {
  const parsed = schemaWyposazenieDodaj.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź poprawność pól formularza." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  const opis = p.description?.length ? p.description : null;
  const { error } = await supabase.from("hall_inventory").insert({
    hall_id: p.hallId,
    category: p.category,
    name: p.name,
    description: opis,
    quantity: p.quantity,
    quantity_available: p.quantity_available ?? p.quantity,
    condition: p.condition || "good",
  });

  if (error) {
    console.error("[dodajWyposazenie]", error.message);
    return { blad: "Nie udało się dodać pozycji (sprawdź uprawnienia sołtysa dla tej sali)." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath("/panel/mieszkaniec/swietlica");
  return { ok: true };
}

export async function usunWyposazenieSwietlicy(
  hallId: string,
  pozycjaId: string
): Promise<WynikProsty> {
  const h = uuid.safeParse(hallId);
  const id = uuid.safeParse(pozycjaId);
  if (!h.success || !id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: poz } = await supabase
    .from("hall_inventory")
    .select("image_url")
    .eq("id", id.data)
    .eq("hall_id", h.data)
    .maybeSingle();
  const staryImg = poz?.image_url ?? null;
  if (staryImg) {
    await usunObiektR2JesliUrlNasz(staryImg);
    const baza = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (baza && staryImg.startsWith(`${baza}/storage/v1/object/public/hall_inventory/`)) {
      const marker = "/hall_inventory/";
      const i = staryImg.indexOf(marker);
      if (i !== -1) {
        const sciezka = staryImg.slice(i + marker.length);
        const { error: rmErr } = await supabase.storage.from("hall_inventory").remove([sciezka]);
        if (rmErr) console.warn("[usunWyposazenie] Storage:", rmErr.message);
      }
    }
  }

  const { error } = await supabase.from("hall_inventory").delete().eq("id", id.data).eq("hall_id", h.data);

  if (error) {
    console.error("[usunWyposazenie]", error.message);
    return { blad: "Nie udało się usunąć pozycji." };
  }

  revalidatePath(`/panel/soltys/swietlica/${h.data}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${h.data}`);
  revalidatePath("/panel/mieszkaniec/swietlica");
  return { ok: true };
}

const schemaWyposazenieAktualizuj = z.object({
  hallId: z.string().uuid(),
  pozycjaId: z.string().uuid(),
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99999),
  quantity_available: z.coerce.number().int().min(0).max(99999).nullable().optional(),
  condition: z.string().trim().max(50).optional().default("good"),
});

export async function aktualizujWyposazenieSwietlicy(
  dane: z.infer<typeof schemaWyposazenieAktualizuj>
): Promise<WynikProsty> {
  const parsed = schemaWyposazenieAktualizuj.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź poprawność pól formularza." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  const opis = p.description?.length ? p.description : null;
  const { error } = await supabase
    .from("hall_inventory")
    .update({
      category: p.category,
      name: p.name,
      description: opis,
      quantity: p.quantity,
      quantity_available: p.quantity_available ?? p.quantity,
      condition: p.condition || "good",
    })
    .eq("id", p.pozycjaId)
    .eq("hall_id", p.hallId);

  if (error) {
    console.error("[aktualizujWyposazenie]", error.message);
    return { blad: "Nie udało się zapisać zmian." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath("/panel/mieszkaniec/swietlica");
  return { ok: true };
}

const schemaZdjecieWyposazenia = z.object({
  hallId: z.string().uuid(),
  pozycjaId: z.string().uuid(),
  image_url: z.union([z.string().url().max(2048), z.null()]),
});

function czyUrlZdjeciaInwentarza(publicUrl: string, hallId: string, pozycjaId: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (base) {
    const pref = `${base}/storage/v1/object/public/hall_inventory/${hallId}/${pozycjaId}-`;
    if (publicUrl.startsWith(pref)) return true;
  }
  const r2 = wyciagnijBucketIKluczZUrlaR2(publicUrl);
  return r2?.bucket === R2_BUCKET_HALL_INVENTORY && r2.key.startsWith(`${hallId}/${pozycjaId}-`);
}

export async function ustawZdjecieWyposazeniaSwietlicy(
  dane: z.infer<typeof schemaZdjecieWyposazenia>
): Promise<WynikProsty> {
  const parsed = schemaZdjecieWyposazenia.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Niepoprawny adres URL zdjęcia." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  if (p.image_url != null && !czyUrlZdjeciaInwentarza(p.image_url, p.hallId, p.pozycjaId)) {
    return { blad: "Adres zdjęcia musi pochodzić z magazynu plików (Supabase lub R2) dla tej pozycji." };
  }

  const { data: istniejacy } = await supabase
    .from("hall_inventory")
    .select("image_url")
    .eq("id", p.pozycjaId)
    .eq("hall_id", p.hallId)
    .maybeSingle();
  const staryUrl = istniejacy?.image_url ?? null;
  if (staryUrl && staryUrl !== p.image_url) {
    await usunObiektR2JesliUrlNasz(staryUrl);
    const baza = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (baza && staryUrl.startsWith(`${baza}/storage/v1/object/public/hall_inventory/`)) {
      const marker = "/hall_inventory/";
      const i = staryUrl.indexOf(marker);
      if (i !== -1) {
        const sciezka = staryUrl.slice(i + marker.length);
        const { error: rmErr } = await supabase.storage.from("hall_inventory").remove([sciezka]);
        if (rmErr) console.warn("[ustawZdjecieWyposazenia] Supabase Storage:", rmErr.message);
      }
    }
  }

  const { error } = await supabase
    .from("hall_inventory")
    .update({ image_url: p.image_url })
    .eq("id", p.pozycjaId)
    .eq("hall_id", p.hallId);

  if (error) {
    console.error("[ustawZdjecieWyposazenia]", error.message);
    return { blad: "Nie udało się zapisać zdjęcia (uprawnienia?)." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath(`/panel/soltys/swietlica/${p.hallId}/dokument`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}/dokument`);
  return { ok: true };
}

export async function zatwierdzRezerwacjeSwietlicy(bookingId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
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

  const { data: wiersz } = await supabase.from("hall_bookings").select("hall_id").eq("id", id.data).maybeSingle();

  const { error } = await supabase
    .from("hall_bookings")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (error) {
    console.error("[zatwierdzRezerwacjeSwietlicy]", error.message);
    return { blad: "Nie udało się zatwierdzić (sprawdź uprawnienia sołtysa)." };
  }

  revalidatePath("/panel/soltys/rezerwacje");
  revalidatePath("/panel/mieszkaniec/swietlica");
  if (wiersz?.hall_id) {
    revalidatePath(`/panel/mieszkaniec/swietlica/${wiersz.hall_id}`);
  }
  return { ok: true };
}

export async function odrzucRezerwacjeSwietlicy(bookingId: string, powod: string): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
  const powodOk = z.string().trim().min(3).max(500).safeParse(powod);
  if (!id.success || !powodOk.success) {
    return { blad: "Podaj powód odrzucenia (3–500 znaków)." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: wiersz } = await supabase.from("hall_bookings").select("hall_id").eq("id", id.data).maybeSingle();

  const { error } = await supabase
    .from("hall_bookings")
    .update({
      status: "rejected",
      rejection_reason: powodOk.data,
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (error) {
    console.error("[odrzucRezerwacjeSwietlicy]", error.message);
    return { blad: "Nie udało się odrzucić rezerwacji." };
  }

  revalidatePath("/panel/soltys/rezerwacje");
  revalidatePath("/panel/mieszkaniec/swietlica");
  if (wiersz?.hall_id) {
    revalidatePath(`/panel/mieszkaniec/swietlica/${wiersz.hall_id}`);
  }
  return { ok: true };
}

/** Po zakończeniu terminu rezerwacji sołtys przechodzi ze statusu „zatwierdzona” na „zakończona” (protokół / rozliczenie). */
export async function oznaczRezerwacjeJakoZakonczonaSwietlicy(bookingId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
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

  const { data: wiersz, error: readErr } = await supabase
    .from("hall_bookings")
    .select("id, hall_id, status, end_at")
    .eq("id", id.data)
    .maybeSingle();

  if (readErr || !wiersz) {
    return { blad: "Nie znaleziono rezerwacji." };
  }

  if (wiersz.status !== "approved") {
    return { blad: "Tylko zatwierdzoną rezerwację można oznaczyć jako zakończoną." };
  }

  const koniec = new Date(wiersz.end_at);
  if (Number.isNaN(koniec.getTime()) || koniec.getTime() > Date.now()) {
    return {
      blad: "Oznaczenie możliwe dopiero po zakończeniu zaplanowanego terminu rezerwacji.",
    };
  }

  const { error } = await supabase
    .from("hall_bookings")
    .update({ status: "completed" })
    .eq("id", id.data)
    .eq("status", "approved");

  if (error) {
    console.error("[oznaczRezerwacjeJakoZakonczonaSwietlicy]", error.message);
    return { blad: "Nie udało się zaktualizować statusu (sprawdź uprawnienia sołtysa)." };
  }

  revalidatePath("/panel/soltys/rezerwacje");
  revalidatePath("/panel/mieszkaniec/swietlica");
  revalidatePath(`/panel/mieszkaniec/swietlica/${wiersz.hall_id}`);
  revalidatePath(`/panel/soltys/swietlica/${wiersz.hall_id}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${wiersz.hall_id}/dokument`);
  revalidatePath(`/panel/soltys/swietlica/${wiersz.hall_id}/dokument`);
  return { ok: true };
}

export async function zapiszPlanSali(hallId: string, plan: PlanSaliJson): Promise<WynikProsty> {
  const idHall = uuid.safeParse(hallId);
  if (!idHall.success) {
    return { blad: "Niepoprawny identyfikator sali." };
  }
  const parsed = schemaPlanSali.safeParse(plan);
  if (!parsed.success) {
    return { blad: "Niepoprawna struktura planu (zbyt wiele elementów lub złe wartości)." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase
    .from("halls")
    .update({ layout_data: parsed.data as unknown as Record<string, unknown> })
    .eq("id", idHall.data);

  if (error) {
    console.error("[zapiszPlanSali]", error.message);
    return { blad: "Nie udało się zapisać planu (uprawnienia sołtysa?)." };
  }

  revalidatePath(`/panel/soltys/swietlica/${idHall.data}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${idHall.data}`);
  revalidatePath(`/panel/soltys/swietlica/${idHall.data}/dokument`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${idHall.data}/dokument`);
  return { ok: true };
}

const schemaRegulaminSali = z.object({
  hallId: z.string().uuid(),
  rules_text: z.string().max(50000).nullable().optional(),
  deposit: z.number().min(0).max(999_999).nullable().optional(),
  price_resident: z.number().min(0).max(999_999).nullable().optional(),
  price_external: z.number().min(0).max(999_999).nullable().optional(),
});

export async function zapiszRegulaminIKaucjeSali(
  dane: z.infer<typeof schemaRegulaminSali>
): Promise<WynikProsty> {
  const parsed = schemaRegulaminSali.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź wprowadzone kwoty i tekst regulaminu." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  const rules = p.rules_text?.trim().length ? p.rules_text.trim() : null;

  const { error } = await supabase
    .from("halls")
    .update({
      rules_text: rules,
      deposit: p.deposit ?? null,
      price_resident: p.price_resident ?? null,
      price_external: p.price_external ?? null,
    })
    .eq("id", p.hallId);

  if (error) {
    console.error("[zapiszRegulaminIKaucjeSali]", error.message);
    return { blad: "Nie udało się zapisać danych sali." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath(`/panel/soltys/swietlica/${p.hallId}/dokument`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}/dokument`);
  return { ok: true };
}

const schemaRegulaminPlacuZabaw = z.object({
  villageId: z.string().uuid(),
  playground_rules_text: z.string().max(50000).nullable().optional(),
});

export async function zapiszRegulaminPlacuZabawWsi(
  dane: z.infer<typeof schemaRegulaminPlacuZabaw>
): Promise<WynikProsty> {
  const parsed = schemaRegulaminPlacuZabaw.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Niepoprawne dane regulaminu placu zabaw." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const tekst =
    parsed.data.playground_rules_text?.trim().length
      ? parsed.data.playground_rules_text.trim()
      : null;

  const { error } = await supabase
    .from("villages")
    .update({ playground_rules_text: tekst })
    .eq("id", parsed.data.villageId);

  if (error) {
    console.error("[zapiszRegulaminPlacuZabawWsi]", error.message);
    return { blad: "Nie udało się zapisać regulaminu (uprawnienia sołtysa w tej wsi?)." };
  }

  const { data: sale } = await supabase.from("halls").select("id").eq("village_id", parsed.data.villageId);
  for (const h of sale ?? []) {
    revalidatePath(`/panel/soltys/swietlica/${h.id}`);
    revalidatePath(`/panel/mieszkaniec/swietlica/${h.id}`);
    revalidatePath(`/panel/soltys/swietlica/${h.id}/dokument`);
    revalidatePath(`/panel/mieszkaniec/swietlica/${h.id}/dokument`);
  }
  return { ok: true };
}

export async function zatwierdzPostSoltysa(postId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(postId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator posta." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: wiersz, error: readErr } = await supabase
    .from("posts")
    .select("id, status")
    .eq("id", id.data)
    .maybeSingle();

  if (readErr || !wiersz || wiersz.status !== "pending") {
    return { blad: "Nie znaleziono posta lub został już rozpatrzony." };
  }

  const teraz = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({
      status: "approved",
      moderated_by: user.id,
      moderated_at: teraz,
      moderation_note: null,
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (error) {
    console.error("[zatwierdzPostSoltysa]", error.message);
    return { blad: "Nie udało się zatwierdzić (uprawnienia sołtysa?)." };
  }

  revalidatePath("/panel/soltys");
  return { ok: true };
}

const notatkaModeracji = z.string().trim().min(3).max(500);

export async function odrzucPostSoltysa(postId: string, notatka: string): Promise<WynikProsty> {
  const id = uuid.safeParse(postId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator posta." };
  }
  const nt = notatkaModeracji.safeParse(notatka);
  if (!nt.success) {
    return { blad: "Krótka notatka dla autora (3–500 znaków) jest wymagana przy odrzuceniu." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: wiersz, error: readErr } = await supabase
    .from("posts")
    .select("id, status, author_id, village_id")
    .eq("id", id.data)
    .maybeSingle();

  if (readErr || !wiersz || wiersz.status !== "pending") {
    return { blad: "Nie znaleziono posta lub został już rozpatrzony." };
  }

  const teraz = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({
      status: "rejected",
      moderated_by: user.id,
      moderated_at: teraz,
      moderation_note: nt.data,
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (error) {
    console.error("[odrzucPostSoltysa]", error.message);
    return { blad: "Nie udało się odrzucić (uprawnienia sołtysa?)." };
  }

  if (wiersz.author_id) {
    const { error: notifErr } = await supabase.from("notifications").insert({
      user_id: wiersz.author_id,
      type: "post_rejected",
      title: "Post nie został zaakceptowany",
      body: nt.data,
      link_url: "/panel/mieszkaniec",
      related_id: wiersz.village_id,
      related_type: "village",
      channel: "in_app",
    });
    if (notifErr) {
      console.warn("[odrzucPostSoltysa] powiadomienie:", notifErr.message);
    }
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/powiadomienia");
  return { ok: true };
}
