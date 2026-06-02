"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijPowiadomienieDoWielu } from "@/lib/powiadomienia/wyslij-powiadomienie";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

async function czySoltysWsi(userId: string, villageId: string) {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const schemaUtworz = z.object({
  villageId: z.string().uuid(),
  pytanie: z.string().min(5).max(500),
  opis: z.string().max(2000).optional(),
  opcje: z.array(z.string().min(1).max(300)).min(2).max(8),
  rozpoczynaSieAt: z.string(),
  konczySieAt: z.string(),
  wymagaMieszkanca: z.boolean().default(true),
  wynikPublicznyWTrakcie: z.boolean().default(false),
});

export async function utworzGlosowanieSoltys(dane: z.infer<typeof schemaUtworz>) {
  const p = schemaUtworz.safeParse(dane);
  if (!p.success) return { blad: "Uzupełnij poprawnie pola głosowania." };

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, p.data.villageId))) return { blad: "Brak uprawnień." };

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: poll, error } = await supabase
    .from("village_polls")
    .insert([
      {
        village_id: p.data.villageId,
        pytanie: p.data.pytanie.trim(),
        opis: p.data.opis?.trim() || null,
        rozpoczyna_sie_at: p.data.rozpoczynaSieAt,
        konczy_sie_at: p.data.konczySieAt,
        status: "zaplanowane",
        wymaga_mieszkanca: p.data.wymagaMieszkanca,
        wynik_publiczny_w_trakcie: p.data.wynikPublicznyWTrakcie,
        utworzone_przez: user.id,
      },
    ])
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.message.includes("village_polls")) return { blad: "Moduł głosowań wymaga migracji bazy." };
    return { blad: error.message };
  }
  if (!poll?.id) return { blad: "Nie udało się utworzyć głosowania." };

  const opcjeRows = p.data.opcje.map((tresc, i) => ({
    poll_id: poll.id,
    tresc: tresc.trim(),
    kolejnosc: i,
  }));
  const { error: optErr } = await supabase.from("village_poll_options").insert(opcjeRows);
  if (optErr) return { blad: optErr.message };

  revalidatePath("/panel/soltys/glosowania");
  return { ok: true as const, id: poll.id };
}

export async function zmienStatusGlosowaniaSoltys(
  pollId: string,
  villageId: string,
  status: "zaplanowane" | "aktywne" | "zakonczone" | "anulowane",
) {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, villageId))) return { blad: "Brak uprawnień." };

  const supabase = utworzKlientaSupabaseSerwer();
  const { error } = await supabase
    .from("village_polls")
    .update({ status })
    .eq("id", pollId)
    .eq("village_id", villageId);

  if (error) return { blad: error.message };

  if (status === "aktywne") {
    const admin = createAdminSupabaseClient();
    const { data: wies } = await supabase
      .from("villages")
      .select("id, name, slug, voivodeship, county, commune")
      .eq("id", villageId)
      .maybeSingle();
    const { data: poll } = await supabase.from("village_polls").select("pytanie").eq("id", pollId).maybeSingle();

    if (admin && wies && poll) {
      const { data: residents } = await admin
        .from("user_village_roles")
        .select("user_id")
        .eq("village_id", villageId)
        .eq("status", "active");
      const ids = (residents ?? []).map((r) => r.user_id as string).filter((id) => id !== user.id);
      const sciezka = sciezkaProfiluWsi(wies);
      await wyslijPowiadomienieDoWielu(admin, ids, {
        typ: "glosowanie",
        tytul: "Nowe głosowanie sołeckie",
        tresc: poll.pytanie as string,
        linkUrl: `${sciezka}#sekcja-glosowania`,
        relatedId: pollId,
        relatedType: "village_poll",
        pushNatychmiast: true,
      });
    }
  }

  revalidatePath("/panel/soltys/glosowania");
  return { ok: true as const };
}

const schemaGlos = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export async function oddajGlosWMiescie(dane: z.infer<typeof schemaGlos>) {
  const p = schemaGlos.safeParse(dane);
  if (!p.success) return { blad: "Nieprawidłowy głos." };

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się, aby głosować." };

  const supabase = utworzKlientaSupabaseSerwer();
  const { error } = await supabase.from("village_poll_votes").upsert(
    {
      poll_id: p.data.pollId,
      option_id: p.data.optionId,
      voter_user_id: user.id,
      oddany_at: new Date().toISOString(),
    },
    { onConflict: "poll_id,voter_user_id" },
  );

  if (error) return { blad: error.message.includes("policy") ? "Brak uprawnień do głosowania." : error.message };
  revalidatePath("/panel/mieszkaniec");
  return { ok: true as const };
}
