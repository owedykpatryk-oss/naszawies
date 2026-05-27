"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { powiadomOGlosowaniuWKonkursieFoto } from "@/lib/powiadomienia/powiadom-o-konkursie-foto";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const uuid = z.string().uuid();
const statusKonkursu = z.enum(["draft", "submissions", "voting", "closed", "cancelled"]);

export type WynikKonkurs = { blad: string } | { ok: true; id?: string };

async function czySoltysWsi(userId: string, villageId: string): Promise<boolean> {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const schemaUtworz = z.object({
  villageId: uuid,
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(4000).optional().nullable(),
  rulesText: z.string().trim().max(4000).optional().nullable(),
  submissionsEnd: z.string(),
  votingStart: z.string(),
  votingEnd: z.string(),
  maxEntriesPerUser: z.number().int().min(1).max(20).default(3),
});

export async function utworzKonkursFotoSoltys(dane: z.infer<typeof schemaUtworz>): Promise<WynikKonkurs> {
  const p = schemaUtworz.safeParse(dane);
  if (!p.success) return { blad: "Uzupełnij poprawnie pola konkursu." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, p.data.villageId))) return { blad: "Brak uprawnień we wsi." };

  const subEnd = new Date(p.data.submissionsEnd);
  const votStart = new Date(p.data.votingStart);
  const votEnd = new Date(p.data.votingEnd);
  if ([subEnd, votStart, votEnd].some((d) => Number.isNaN(d.getTime()))) {
    return { blad: "Niepoprawne daty." };
  }
  if (subEnd >= votStart || votStart >= votEnd) {
    return { blad: "Kolejność dat: najpierw zgłoszenia, potem głosowanie." };
  }

  const { data: row, error } = await supabase
    .from("village_photo_contests")
    .insert({
      village_id: p.data.villageId,
      created_by: user.id,
      title: p.data.title,
      description: p.data.description?.length ? p.data.description : null,
      rules_text: p.data.rulesText?.length ? p.data.rulesText : null,
      status: "draft",
      submissions_start: new Date().toISOString(),
      submissions_end: subEnd.toISOString(),
      voting_start: votStart.toISOString(),
      voting_end: votEnd.toISOString(),
      max_entries_per_user: p.data.maxEntriesPerUser,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[utworzKonkursFotoSoltys]", error.message);
    return { blad: "Nie udało się utworzyć konkursu." };
  }

  revalidatePath("/panel/soltys/konkursy");
  revalidatePath("/panel/soltys/fotokronika");
  return { ok: true, id: row?.id };
}

const schemaStatus = z.object({
  contestId: uuid,
  status: statusKonkursu,
  winnerPhotoId: uuid.optional().nullable(),
});

export async function zmienStatusKonkursuFotoSoltys(dane: z.infer<typeof schemaStatus>): Promise<WynikKonkurs> {
  const p = schemaStatus.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: konkurs } = await supabase
    .from("village_photo_contests")
    .select("id, village_id, status, title, villages(voivodeship, county, commune, slug)")
    .eq("id", p.data.contestId)
    .maybeSingle();
  if (!konkurs) return { blad: "Nie znaleziono konkursu." };
  if (!(await czySoltysWsi(user.id, konkurs.village_id))) return { blad: "Brak uprawnień." };

  const update: Record<string, unknown> = { status: p.data.status };
  if (p.data.status === "closed") {
    let winnerId = p.data.winnerPhotoId ?? null;
    if (!winnerId) {
      const { data: top } = await supabase
        .from("photos")
        .select("id")
        .eq("contest_id", p.data.contestId)
        .eq("status", "approved")
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      winnerId = top?.id ?? null;
    }
    if (winnerId) update.winner_photo_id = winnerId;
  }

  const { error } = await supabase.from("village_photo_contests").update(update).eq("id", p.data.contestId);
  if (error) {
    console.error("[zmienStatusKonkursuFotoSoltys]", error.message);
    return { blad: "Nie udało się zmienić statusu." };
  }

  if (p.data.status === "voting" && konkurs.status !== "voting") {
    const v = Array.isArray(konkurs.villages) ? konkurs.villages[0] : konkurs.villages;
    if (v?.slug) {
      await powiadomOGlosowaniuWKonkursieFoto({
        villageId: konkurs.village_id,
        contestId: p.data.contestId,
        title: konkurs.title,
        sciezkaProfilu: sciezkaProfiluWsi({
          voivodeship: v.voivodeship,
          county: v.county,
          commune: v.commune,
          slug: v.slug,
        }),
      });
    }
  }

  revalidatePath("/panel/soltys/konkursy");
  revalidatePath("/wies");
  return { ok: true };
}
