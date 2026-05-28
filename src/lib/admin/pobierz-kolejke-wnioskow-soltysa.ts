import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type { WniosekAdminWiersz } from "@/lib/admin/typy-wniosek-soltysa";

export async function pobierzKolejkeWnioskowSoltysaAdmin(): Promise<WniosekAdminWiersz[]> {
  const adminSb = createAdminSupabaseClient();
  if (!adminSb) return [];

  const { data: appRows } = await adminSb
    .from("soltys_village_applications")
    .select(
      "id, user_id, village_id, teryt_id, village_name, commune, county, voivodeship, applicant_display_name, applicant_phone, note, created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(40);

  const emails: Record<string, string> = {};
  for (const row of appRows ?? []) {
    const { data: authUser } = await adminSb.auth.admin.getUserById(row.user_id);
    emails[row.user_id] = authUser?.user?.email ?? "—";
  }

  return (appRows ?? []).map((r) => ({
    ...r,
    email: emails[r.user_id] ?? "—",
  }));
}
