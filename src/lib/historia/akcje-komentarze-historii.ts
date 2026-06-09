"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const schema = z.object({
  entryId: z.string().uuid(),
  villageId: z.string().uuid(),
  body: z.string().trim().min(2).max(600),
});

type Wynik = { ok?: true; blad?: string };

export async function dodajKomentarzPodWpisHistorii(dane: z.infer<typeof schema>): Promise<Wynik> {
  const p = schema.safeParse(dane);
  if (!p.success) return { blad: "Napisz krótki komentarz (2–600 znaków)." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się, aby komentować." };

  const { data: wpis } = await supabase
    .from("village_history_entries")
    .select("id, village_id, status")
    .eq("id", p.data.entryId)
    .maybeSingle();

  if (!wpis || wpis.village_id !== p.data.villageId || wpis.status !== "approved") {
    return { blad: "Nie znaleziono wpisu kroniki." };
  }

  const { error } = await supabase.from("village_history_entry_comments").insert({
    entry_id: p.data.entryId,
    village_id: p.data.villageId,
    author_id: user.id,
    body: p.data.body,
    status: "visible",
  });

  if (error) {
    console.error("[dodajKomentarzPodWpisHistorii]", error.message);
    return { blad: "Nie udało się dodać komentarza. Upewnij się, że obserwujesz wsię lub masz rolę mieszkańca." };
  }

  revalidatePath("/wies", "layout");
  return { ok: true };
}
