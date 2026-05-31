"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { KATEGORIE_PROPONOWALNE_POI } from "@/lib/mapa/kategorie-poi-bazowe";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { roleDlaUprawnienia } from "@/lib/panel/uprawnienia-wsi";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export type WynikPropozycjiPoi = { ok: true } | { blad: string };

const schemaPropozycja = z.object({
  villageId: z.string().uuid(),
  category: z
    .string()
    .trim()
    .refine((c) => (KATEGORIE_PROPONOWALNE_POI as readonly string[]).includes(c), "Niepoprawna kategoria"),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(800).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

async function uzytkownikMaDostepDoWsi(userId: string, villageId: string): Promise<boolean> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase
    .from("user_village_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("village_id", villageId)
    .eq("status", "active")
    .in("role", [...roleDlaUprawnienia("dostep_podstawowy")])
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** Mieszkaniec proponuje brakujący punkt na mapie. */
export async function zlozPropozycjePoi(niesprawdzone: unknown): Promise<WynikPropozycjiPoi> {
  const p = schemaPropozycja.safeParse(niesprawdzone);
  if (!p.success) return { blad: "Uzupełnij poprawnie nazwę, kategorię i lokalizację." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const maDostep = await uzytkownikMaDostepDoWsi(user.id, p.data.villageId);
  if (!maDostep) return { blad: "Nie masz aktywnej roli w tej wsi." };

  const { error } = await supabase.from("poi_proposals").insert({
    village_id: p.data.villageId,
    proposed_by: user.id,
    category: p.data.category,
    name: p.data.name,
    description: p.data.description?.trim() || null,
    latitude: p.data.latitude,
    longitude: p.data.longitude,
    status: "pending",
  });

  if (error) {
    console.error("[zlozPropozycjePoi]", error.message);
    return { blad: "Nie udało się wysłać propozycji." };
  }

  const { data: wies } = await supabase
    .from("villages")
    .select("name, soltys_user_id")
    .eq("id", p.data.villageId)
    .maybeSingle();

  if (wies?.soltys_user_id) {
    await supabase.from("notifications").insert({
      user_id: wies.soltys_user_id,
      type: "poi_proposal",
      title: "Nowa propozycja punktu na mapie",
      body: `${p.data.name} — ${wies.name ?? "wies"}. Zatwierdź w panelu Moja wieś.`,
      link_url: "/panel/soltys/moja-wies",
      related_id: p.data.villageId,
      related_type: "village",
      channel: "in_app",
    });
  }

  revalidatePath("/panel/soltys/moja-wies");
  return { ok: true };
}

const schemaReview = z.object({
  proposalId: z.string().uuid(),
  reviewNote: z.string().trim().max(400).optional().nullable(),
});

/** Sołtys akceptuje propozycję — tworzy POI na mapie. */
export async function zatwierdzPropozycjePoi(niesprawdzone: unknown): Promise<WynikPropozycjiPoi> {
  const p = schemaReview.safeParse(niesprawdzone);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: prop, error: errProp } = await supabase
    .from("poi_proposals")
    .select("id, village_id, category, name, description, latitude, longitude, status")
    .eq("id", p.data.proposalId)
    .maybeSingle();

  if (errProp || !prop) return { blad: "Nie znaleziono propozycji." };
  if (prop.status !== "pending") return { blad: "Propozycja została już rozpatrzona." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(prop.village_id)) return { blad: "Brak uprawnień do tej wsi." };

  const { data: poi, error: errPoi } = await supabase
    .from("pois")
    .insert({
      village_id: prop.village_id,
      category: prop.category,
      name: prop.name,
      description: prop.description ?? "Dodane po propozycji mieszkańca.",
      latitude: prop.latitude,
      longitude: prop.longitude,
      source: "local_corrected",
      confidence: 0.95,
      verified_at: new Date().toISOString(),
      is_local_override: true,
    })
    .select("id")
    .single();

  if (errPoi || !poi) {
    console.error("[zatwierdzPropozycjePoi]", errPoi?.message);
    return { blad: "Nie udało się utworzyć punktu na mapie." };
  }

  const { error: errUpd } = await supabase
    .from("poi_proposals")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: p.data.reviewNote?.trim() || null,
      created_poi_id: poi.id,
    })
    .eq("id", prop.id);

  if (errUpd) {
    console.error("[zatwierdzPropozycjePoi] update", errUpd.message);
    return { blad: "Punkt utworzony, ale nie udało się zamknąć propozycji." };
  }

  const { data: village } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", prop.village_id)
    .maybeSingle();

  revalidatePath("/mapa");
  revalidatePath("/panel/soltys/moja-wies");
  if (village) revalidatePath(sciezkaProfiluWsi(village));
  return { ok: true };
}

/** Sołtys odrzuca propozycję. */
export async function odrzucPropozycjePoi(niesprawdzone: unknown): Promise<WynikPropozycjiPoi> {
  const p = schemaReview.safeParse(niesprawdzone);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: prop } = await supabase
    .from("poi_proposals")
    .select("id, village_id, status")
    .eq("id", p.data.proposalId)
    .maybeSingle();

  if (!prop) return { blad: "Nie znaleziono propozycji." };
  if (prop.status !== "pending") return { blad: "Propozycja została już rozpatrzona." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(prop.village_id)) return { blad: "Brak uprawnień." };

  const { error } = await supabase
    .from("poi_proposals")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: p.data.reviewNote?.trim() || null,
    })
    .eq("id", prop.id);

  if (error) {
    console.error("[odrzucPropozycjePoi]", error.message);
    return { blad: "Nie udało się odrzucić propozycji." };
  }

  revalidatePath("/panel/soltys/moja-wies");
  return { ok: true };
}
