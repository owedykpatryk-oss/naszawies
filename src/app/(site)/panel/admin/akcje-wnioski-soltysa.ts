"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type WynikAdminWniosek = { blad: string } | { ok: true; villageId?: string };

export async function adminZatwierdzWniosekSoltysa(applicationId: string): Promise<WynikAdminWniosek> {
  const id = uuid.safeParse(applicationId);
  if (!id.success) return { blad: "Niepoprawny identyfikator wniosku." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyAdminPlatformy(supabase))) {
    return { blad: "Brak uprawnień administratora platformy." };
  }

  const { data, error } = await supabase.rpc("admin_zatwierdz_wniosek_soltysa", {
    p_application_id: id.data,
  });

  if (error) {
    const m = error.message;
    if (m.includes("Brak uprawnień") || m.includes("42501")) {
      return { blad: "To konto nie ma uprawnień administratora platformy." };
    }
    return { blad: m || "Nie udało się zatwierdzić wniosku." };
  }

  const villageId = typeof data === "string" ? data : null;
  revalidatePath("/panel/admin");
  revalidatePath("/panel/soltys");
  revalidatePath("/szukaj");
  revalidatePath("/mapa");
  return { ok: true, villageId: villageId ?? undefined };
}

export async function adminOdrzucWniosekSoltysa(
  applicationId: string,
  adminNote?: string | null,
): Promise<WynikAdminWniosek> {
  const id = uuid.safeParse(applicationId);
  if (!id.success) return { blad: "Niepoprawny identyfikator wniosku." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyAdminPlatformy(supabase))) {
    return { blad: "Brak uprawnień administratora platformy." };
  }

  const { error } = await supabase.rpc("admin_odrzuc_wniosek_soltysa", {
    p_application_id: id.data,
    p_admin_note: adminNote?.trim() || null,
  });

  if (error) {
    if (error.message.includes("Brak uprawnień")) {
      return { blad: "To konto nie ma uprawnień administratora platformy." };
    }
    return { blad: error.message || "Nie udało się odrzucić wniosku." };
  }

  revalidatePath("/panel/admin");
  return { ok: true };
}
