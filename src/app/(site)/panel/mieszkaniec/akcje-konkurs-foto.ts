"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type WynikGlos = { blad: string } | { ok: true };

const schemaGlos = z.object({
  contestId: uuid,
  photoId: uuid,
});

export async function glosujWKonkursieFoto(dane: z.infer<typeof schemaGlos>): Promise<WynikGlos> {
  const p = schemaGlos.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawny głos." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się, aby oddać głos." };

  const { data: konkurs } = await supabase
    .from("village_photo_contests")
    .select("id, village_id, status, voting_start, voting_end")
    .eq("id", p.data.contestId)
    .maybeSingle();
  if (!konkurs || konkurs.status !== "voting") {
    return { blad: "Głosowanie nie jest aktywne." };
  }
  const teraz = Date.now();
  if (teraz < new Date(konkurs.voting_start).getTime() || teraz > new Date(konkurs.voting_end).getTime()) {
    return { blad: "Głosowanie poza terminem." };
  }

  const { data: foto } = await supabase
    .from("photos")
    .select("id, contest_id, status")
    .eq("id", p.data.photoId)
    .maybeSingle();
  if (!foto || foto.contest_id !== p.data.contestId || foto.status !== "approved") {
    return { blad: "To zdjęcie nie bierze udziału w głosowaniu." };
  }

  const { error } = await supabase.from("village_photo_votes").upsert(
    {
      contest_id: p.data.contestId,
      photo_id: p.data.photoId,
      user_id: user.id,
    },
    { onConflict: "contest_id,user_id" },
  );

  if (error) {
    console.error("[glosujWKonkursieFoto]", error.message);
    return { blad: "Nie udało się zapisać głosu. Upewnij się, że obserwujesz wieś lub masz aktywną rolę." };
  }

  revalidatePath("/wies");
  return { ok: true };
}
