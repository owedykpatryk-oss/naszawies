"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

const statusy = z.enum(["w_trakcie", "rozwiazane", "odrzucone"]);

const schemaAkt = z.object({
  issueId: uuid,
  status: statusy,
  resolutionNote: z.string().trim().max(2000).optional().nullable(),
});

export type WynikAktZgl = { blad: string } | { ok: true };

export async function zaktualizujZgloszenieSoltys(
  dane: z.infer<typeof schemaAkt>
): Promise<WynikAktZgl> {
  const p = schemaAkt.safeParse(dane);
  if (!p.success) {
    return { blad: "Niepoprawne dane formularza." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return { blad: "Brak uprawnień sołtysa." };
  }

  const { data: w, error: rE } = await supabase
    .from("issues")
    .select("id, village_id, status")
    .eq("id", p.data.issueId)
    .maybeSingle();

  if (rE || !w) {
    return { blad: "Nie znaleziono zgłoszenia." };
  }
  if (!villageIds.includes(w.village_id)) {
    return { blad: "To zgłoszenie dotyczy innej wsi." };
  }

  const up: Record<string, unknown> = {
    status: p.data.status,
    resolution_note: p.data.resolutionNote?.length ? p.data.resolutionNote : null,
  };
  if (p.data.status === "w_trakcie") {
    up.resolved_at = null;
  } else {
    up.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("issues")
    .update(up)
    .eq("id", p.data.issueId)
    .eq("village_id", w.village_id);

  if (error) {
    console.error("[zaktualizujZgloszenieSoltys]", error.message);
    return { blad: "Nie udało się zapisać zmian." };
  }

  revalidatePath("/panel/soltys/zgloszenia");
  revalidatePath("/panel/mieszkaniec/zgloszenia");
  return { ok: true };
}
