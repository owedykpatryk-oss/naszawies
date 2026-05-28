"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();
const teryt = z.string().trim().min(4).max(20);

export type WynikWniosekSoltysa = { blad: string } | { ok: true; komunikat?: string };

export async function zlozWniosekSoltysa(dane: {
  villageId?: string | null;
  terytId: string;
  villageName: string;
  commune: string;
  county: string;
  voivodeship: string;
  note?: string | null;
}): Promise<WynikWniosekSoltysa> {
  const p = z
    .object({
      villageId: uuid.optional().nullable(),
      terytId: teryt,
      villageName: z.string().trim().min(2).max(200),
      commune: z.string().trim().min(2).max(100),
      county: z.string().trim().min(2).max(100),
      voivodeship: z.string().trim().min(2).max(100),
      note: z.string().trim().max(2000).optional().nullable(),
    })
    .safeParse(dane);
  if (!p.success) {
    return { blad: p.error.issues[0]?.message ?? "Sprawdź dane wniosku." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const soltysWsi = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (soltysWsi.length > 0) {
    return { blad: "Masz już aktywną rolę sołtysa lub współadministratora." };
  }

  const { data: profil } = await supabase.from("users").select("display_name, phone").eq("id", user.id).maybeSingle();

  let villageId: string | null = p.data.villageId ?? null;
  if (villageId) {
    const { data: w } = await supabase
      .from("villages")
      .select("id, soltys_user_id, teryt_id")
      .eq("id", villageId)
      .maybeSingle();
    if (!w) {
      return { blad: "Nie znaleziono wskazanej miejscowości w serwisie." };
    }
    if (w.soltys_user_id) {
      return { blad: "Ta wieś ma już przypisanego sołtysa — skontaktuj się z administratorem platformy." };
    }
    if (w.teryt_id && w.teryt_id !== p.data.terytId) {
      villageId = w.id;
    }
  } else {
    const { data: w } = await supabase
      .from("villages")
      .select("id, soltys_user_id")
      .eq("teryt_id", p.data.terytId)
      .maybeSingle();
    if (w?.soltys_user_id) {
      return { blad: "Ta miejscowość ma już sołtysa w serwisie." };
    }
    villageId = w?.id ?? null;
  }

  const { error } = await supabase.from("soltys_village_applications").insert({
    user_id: user.id,
    village_id: villageId,
    teryt_id: p.data.terytId,
    village_name: p.data.villageName,
    commune: p.data.commune,
    county: p.data.county,
    voivodeship: p.data.voivodeship,
    applicant_display_name: profil?.display_name?.trim() || null,
    applicant_phone: profil?.phone?.trim() || null,
    note: p.data.note?.length ? p.data.note : null,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return {
        blad: "Masz już oczekujący wniosek o tę miejscowość (lub inny w toku). Poczekaj na decyzję administratora.",
      };
    }
    console.error("[zlozWniosekSoltysa]", error.message);
    return { blad: error.message || "Nie udało się złożyć wniosku." };
  }

  revalidatePath("/panel");
  revalidatePath("/panel/wniosek-soltysa");
  revalidatePath("/panel/admin");
  return {
    ok: true,
    komunikat:
      "Wniosek wysłany. Administrator platformy zweryfikuje dane i aktywuje profil wsi — dostaniesz dostęp do panelu sołtysa po zatwierdzeniu.",
  };
}

/** Po rejestracji z intencją „sołtys” — jednorazowo tworzy wniosek z metadanych konta. */
export async function utworzWniosekSoltysaZRejestracji(): Promise<void> {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.user_metadata || typeof user.user_metadata !== "object") return;

  const meta = user.user_metadata as Record<string, unknown>;
  if (meta.signup_intent !== "soltys") return;

  const terytId = typeof meta.signup_village_teryt === "string" ? meta.signup_village_teryt.trim() : "";
  const label = typeof meta.signup_village_label === "string" ? meta.signup_village_label : "";
  const villageIdRaw = typeof meta.signup_village_id === "string" ? meta.signup_village_id.trim() : "";
  if (!terytId || terytId.length < 4) return;

  const { count } = await supabase
    .from("soltys_village_applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (typeof count === "number" && count > 0) return;

  const soltysWsi = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (soltysWsi.length > 0) return;

  const czesci = label.split("·").map((s) => s.trim());
  const nazwa = czesci[0] || "Miejscowość";
  const gminaPowWoj = (czesci[1] ?? "").split(",").map((s) => s.trim());
  const gmina = gminaPowWoj[0] ?? "";
  const powiat = gminaPowWoj[1] ?? "";
  const woj = gminaPowWoj[2] ?? "";

  let villageId: string | null = null;
  if (villageIdRaw && z.string().uuid().safeParse(villageIdRaw).success) {
    villageId = villageIdRaw;
  }

  await supabase.from("soltys_village_applications").insert({
    user_id: user.id,
    village_id: villageId,
    teryt_id: terytId,
    village_name: nazwa,
    commune: gmina || "—",
    county: powiat || "—",
    voivodeship: woj || "—",
    applicant_display_name:
      typeof meta.display_name === "string" ? meta.display_name.trim() : null,
    status: "pending",
    note: "Wniosek utworzony automatycznie po rejestracji z intencją sołtys.",
  });
}

export async function cofnijWniosekSoltysa(applicationId: string): Promise<WynikWniosekSoltysa> {
  const id = uuid.safeParse(applicationId);
  if (!id.success) return { blad: "Niepoprawny identyfikator wniosku." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { error } = await supabase
    .from("soltys_village_applications")
    .update({ status: "withdrawn" })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    return { blad: "Nie udało się cofnąć wniosku." };
  }

  revalidatePath("/panel/wniosek-soltysa");
  revalidatePath("/panel/admin");
  return { ok: true, komunikat: "Wniosek został wycofany." };
}
