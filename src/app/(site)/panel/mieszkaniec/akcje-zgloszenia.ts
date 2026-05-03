"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { powiadomSoltysowIObserwujacychONowymZgloszeniu } from "@/lib/powiadomienia/powiadom-o-nowym-zgloszeniu";
import { SZYBKIE_OZNACZENIA, type KluczSzybkiegoOznaczenia } from "@/lib/zgloszenia/szybkie-etykiety";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

const dozwoloneKlucze = new Set<string>(SZYBKIE_OZNACZENIA.map((x) => x.key));

const schemaDodaj = z.object({
  villageId: uuid,
  category: z.enum([
    "droga",
    "oswietlenie",
    "woda",
    "prad",
    "smieci",
    "infrastruktura",
    "inne",
  ]),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(8000),
  locationText: z.string().trim().max(500).optional().nullable(),
  isUrgent: z.boolean(),
  /** ISO albo null */
  observedAt: z.union([z.string().min(1), z.null()]).optional(),
  imageUrls: z.array(z.string().url().max(2048)).max(6),
  quickFlags: z.record(z.string(), z.boolean()).optional(),
});

export type WynikZgloszenia = { blad: string } | { ok: true; id: string };

function oczyscQuickFlags(
  v: Record<string, boolean> | undefined
): Record<string, boolean> {
  if (!v) return {};
  const o: Record<string, boolean> = {};
  for (const [k, val] of Object.entries(v)) {
    if (dozwoloneKlucze.has(k) && val === true) {
      o[k as KluczSzybkiegoOznaczenia] = true;
    }
  }
  return o;
}

export async function dodajZgloszenieProblemu(body: z.infer<typeof schemaDodaj>): Promise<WynikZgloszenia> {
  const p = schemaDodaj.safeParse(body);
  if (!p.success) {
    return { blad: "Uzupełnij tytuł, opis (min. 10 znaków) i wybierz kategorię." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const d = p.data;
  let observedAt: string | null = null;
  if (d.observedAt && d.observedAt.length > 0) {
    const t = new Date(d.observedAt);
    if (!Number.isNaN(t.getTime())) {
      observedAt = t.toISOString();
    }
  }

  const { data: wstaw, error } = await supabase
    .from("issues")
    .insert({
      village_id: d.villageId,
      reporter_id: user.id,
      category: d.category,
      title: d.title,
      description: d.description,
      location_text: d.locationText?.length ? d.locationText : null,
      is_urgent: d.isUrgent,
      observed_at: observedAt,
      image_urls: d.imageUrls.length ? d.imageUrls : null,
      quick_flags: oczyscQuickFlags(d.quickFlags),
      status: "nowe",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[dodajZgloszenieProblemu]", error.message);
    return { blad: "Nie udało się wysłać zgłoszenia (uprawnienia do wsi albo błąd zapisu)." };
  }
  if (!wstaw?.id) {
    return { blad: "Nie udało się potwierdzić zapisu." };
  }

  const admin = createAdminSupabaseClient();
  if (admin) {
    await powiadomSoltysowIObserwujacychONowymZgloszeniu(admin, {
      villageId: d.villageId,
      title: d.title,
      reporterUserId: user.id,
    });
  }

  revalidatePath("/panel/mieszkaniec/zgloszenia");
  revalidatePath("/panel/soltys/zgloszenia");
  revalidatePath("/panel/powiadomienia");
  return { ok: true, id: wstaw.id };
}
