"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const schema = z.object({
  villageId: z.string().uuid(),
  kind: z.enum(["szukam", "oferuje"]),
  category: z.enum(["transport", "zakupy", "opieka", "inne"]),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(4000),
  contactHint: z.string().trim().max(200).optional().nullable(),
  dniWaznosci: z.number().int().min(1).max(60).optional(),
});

export type WynikPomocy = { blad: string } | { ok: true };

export async function dodajOfertePomocySasiedzkiej(body: z.infer<typeof schema>): Promise<WynikPomocy> {
  const p = schema.safeParse(body);
  if (!p.success) return { blad: "Sprawdź tytuł i opis oferty." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const dni = p.data.dniWaznosci ?? 14;
  const expires = new Date();
  expires.setDate(expires.getDate() + dni);

  const { error } = await supabase.from("neighbor_help_offers").insert({
    village_id: p.data.villageId,
    author_user_id: user.id,
    kind: p.data.kind,
    category: p.data.category,
    title: p.data.title,
    body: p.data.body,
    contact_hint: p.data.contactHint?.length ? p.data.contactHint : null,
    status: "pending",
    expires_at: expires.toISOString(),
  });

  if (error) {
    console.error("[dodajOfertePomocySasiedzkiej]", error.message);
    return { blad: "Nie udało się dodać oferty (uprawnienia do wsi?)." };
  }

  revalidatePath("/panel/mieszkaniec/pomoc-sasiedzka");
  revalidatePath("/panel/soltys/spolecznosc");
  return { ok: true };
}
