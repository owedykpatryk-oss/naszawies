"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const schema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(2).max(600),
});

type Wynik = { ok?: true; blad?: string };

export async function dodajKomentarzPodOgloszenie(dane: z.infer<typeof schema>): Promise<Wynik> {
  const p = schema.safeParse(dane);
  if (!p.success) return { blad: "Napisz krótki komentarz (2–600 znaków)." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się, aby komentować." };

  const { data: post } = await supabase
    .from("posts")
    .select("id, village_id, status")
    .eq("id", p.data.postId)
    .maybeSingle();

  if (!post || post.status !== "approved") {
    return { blad: "Nie znaleziono ogłoszenia." };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: p.data.postId,
    author_id: user.id,
    body: p.data.body,
    status: "approved",
  });

  if (error) {
    console.error("[dodajKomentarzPodOgloszenie]", error.message);
    return { blad: "Nie udało się dodać komentarza." };
  }

  revalidatePath("/wies", "layout");
  return { ok: true };
}
