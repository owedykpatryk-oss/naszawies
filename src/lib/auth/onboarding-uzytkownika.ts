import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";

export type IntencjaOnboardingu = "mieszkaniec" | "soltys" | "przegladam";

export function sciezkaPomijaOnboarding(pathname: string): boolean {
  if (pathname === "/panel/onboarding" || pathname.startsWith("/panel/onboarding/")) return true;
  if (pathname === "/wyloguj") return true;
  return false;
}

export function sciezkaWymagaOnboardingu(pathname: string): boolean {
  if (sciezkaPomijaOnboarding(pathname)) return false;
  if (pathname === "/mapa" || pathname.startsWith("/mapa/")) return true;
  if (pathname === "/panel" || pathname.startsWith("/panel/")) return true;
  return false;
}

function metaRejestracjiWystarczajaca(meta: Record<string, unknown>): boolean {
  const villageId = typeof meta.signup_village_id === "string" ? meta.signup_village_id.trim() : "";
  if (!villageId || !z.string().uuid().safeParse(villageId).success) return false;
  const intent = typeof meta.signup_intent === "string" ? meta.signup_intent : "";
  return intent === "mieszkaniec" || intent === "soltys";
}

/** Czy użytkownik przeszedł wybór roli / wsi (metadane, role w bazie lub rejestracja e-mail). */
export async function czyUzytkownikUknczylOnboarding(
  supabase: SupabaseClient,
  user: User,
): Promise<boolean> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  if (typeof meta.onboarding_completed_at === "string" && meta.onboarding_completed_at.trim().length > 0) {
    return true;
  }

  if (metaRejestracjiWystarczajaca(meta)) {
    return true;
  }

  const soltysIds = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (soltysIds.length > 0) return true;

  const [roleCount, followCount, soltysAppCount] = await Promise.all([
    supabase
      .from("user_village_roles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("soltys_village_applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if ((roleCount.count ?? 0) > 0) return true;
  if ((followCount.count ?? 0) > 0) return true;
  if ((soltysAppCount.count ?? 0) > 0) return true;

  return false;
}
