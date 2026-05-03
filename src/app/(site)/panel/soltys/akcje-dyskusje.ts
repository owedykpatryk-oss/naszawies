"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type WynikModeracji = { blad: string } | { ok: true; komunikat?: string };

export async function zamknijWatekDyskusjiSoltys(threadId: string): Promise<WynikModeracji> {
  const id = uuid.safeParse(threadId);
  if (!id.success) return { blad: "Niepoprawny identyfikator wątku." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_discussion_threads")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!row) return { blad: "Nie znaleziono wątku." };
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!ids.includes(row.village_id)) return { blad: "Brak uprawnień do tej wsi." };

  const { error } = await supabase
    .from("village_discussion_threads")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: user.id,
    })
    .eq("id", id.data);
  if (error) {
    console.error("[zamknijWatekDyskusjiSoltys]", error.message);
    return { blad: "Nie udało się zamknąć wątku." };
  }
  revalidatePath("/panel/soltys/spolecznosc/moderacja");
  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true, komunikat: "Wątek został zamknięty." };
}

export async function ukryjWatekDyskusjiSoltys(threadId: string, notatka = ""): Promise<WynikModeracji> {
  const id = uuid.safeParse(threadId);
  if (!id.success) return { blad: "Niepoprawny identyfikator wątku." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_discussion_threads")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!row) return { blad: "Nie znaleziono wątku." };
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!ids.includes(row.village_id)) return { blad: "Brak uprawnień do tej wsi." };

  const { error } = await supabase
    .from("village_discussion_threads")
    .update({
      status: "hidden",
      moderation_note: notatka.trim() || "Ukryto przez moderację sołtysa.",
      closed_at: new Date().toISOString(),
      closed_by: user.id,
    })
    .eq("id", id.data);
  if (error) {
    console.error("[ukryjWatekDyskusjiSoltys]", error.message);
    return { blad: "Nie udało się ukryć wątku." };
  }
  revalidatePath("/panel/soltys/spolecznosc/moderacja");
  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true, komunikat: "Wątek został ukryty." };
}

export async function ukryjKomentarzDyskusjiSoltys(commentId: string, notatka = ""): Promise<WynikModeracji> {
  const id = uuid.safeParse(commentId);
  if (!id.success) return { blad: "Niepoprawny identyfikator komentarza." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_discussion_comments")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!row) return { blad: "Nie znaleziono komentarza." };
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!ids.includes(row.village_id)) return { blad: "Brak uprawnień do tej wsi." };

  const { error } = await supabase
    .from("village_discussion_comments")
    .update({
      status: "hidden",
      moderation_note: notatka.trim() || "Komentarz ukryty przez moderację.",
    })
    .eq("id", id.data);
  if (error) {
    console.error("[ukryjKomentarzDyskusjiSoltys]", error.message);
    return { blad: "Nie udało się ukryć komentarza." };
  }

  revalidatePath("/panel/soltys/spolecznosc/moderacja");
  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true, komunikat: "Komentarz został ukryty." };
}

const schemaRaportDecyzja = z.object({
  reportId: z.string().uuid(),
  decyzja: z.enum(["resolved", "rejected"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function rozpatrzRaportSpolecznosciSoltys(
  dane: z.infer<typeof schemaRaportDecyzja>,
): Promise<WynikModeracji> {
  const parsed = schemaRaportDecyzja.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane decyzji." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: raport } = await supabase
    .from("village_content_reports")
    .select("id, village_id, content_type, content_id")
    .eq("id", parsed.data.reportId)
    .maybeSingle();
  if (!raport) return { blad: "Nie znaleziono zgłoszenia." };
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!ids.includes(raport.village_id)) return { blad: "Brak uprawnień do tej wsi." };

  if (parsed.data.decyzja === "resolved") {
    if (raport.content_type === "thread") {
      await supabase
        .from("village_discussion_threads")
        .update({ status: "hidden", moderation_note: "Ukryto po zgłoszeniu mieszkańca." })
        .eq("id", raport.content_id);
    } else if (raport.content_type === "comment") {
      await supabase
        .from("village_discussion_comments")
        .update({ status: "hidden", moderation_note: "Ukryto po zgłoszeniu mieszkańca." })
        .eq("id", raport.content_id);
    } else if (raport.content_type === "blog_post") {
      await supabase
        .from("village_blog_posts")
        .update({ status: "rejected", moderation_note: "Odrzucono po zgłoszeniu mieszkańca." })
        .eq("id", raport.content_id);
    }
  }

  const { error } = await supabase
    .from("village_content_reports")
    .update({
      status: parsed.data.decyzja,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: parsed.data.note?.trim() || null,
    })
    .eq("id", parsed.data.reportId);
  if (error) {
    console.error("[rozpatrzRaportSpolecznosciSoltys]", error.message);
    return { blad: "Nie udało się zapisać decyzji moderacji." };
  }

  revalidatePath("/panel/soltys/spolecznosc/moderacja");
  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true, komunikat: "Raport został rozpatrzony." };
}
