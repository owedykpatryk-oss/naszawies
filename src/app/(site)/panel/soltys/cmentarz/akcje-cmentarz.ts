"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzObrysyCmentarzyZOsm } from "@/lib/cmentarz/overpass-cmentarz-obrys";
import {
  georefZCmentarzaBoundary,
  uzupelnijWspolrzedneGrobow,
  wspolrzedneElementuPlanu,
} from "@/lib/cmentarz/georef-cmentarza";
import { parsujPlanCmentarza, schemaPlanCmentarza, szablonPlanuCmentarzaStartowy } from "@/lib/cmentarz/plan-cmentarza";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

type Wynik = { ok: true } | { blad: string };

const uuid = z.string().uuid();

async function revalidateCmentarz(supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>, villageId: string) {
  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  if (v?.slug) {
    const sciezka = sciezkaProfiluWsi(v);
    revalidatePath(sciezka);
    revalidatePath(`${sciezka}/cmentarz`);
  }
  revalidatePath("/panel/soltys/cmentarz");
}

export async function utworzLubPobierzPlanCmentarza(villageId: string): Promise<
  | { blad: string }
  | {
      ok: true;
      plan: {
        id: string;
        name: string;
        is_published: boolean;
        virtual_candles_enabled: boolean;
        orthophoto_enabled: boolean;
        boundary_geojson: unknown;
        plan_data: ReturnType<typeof parsujPlanCmentarza>;
        gate_slug: string | null;
      };
    }
> {
  const vid = uuid.safeParse(villageId);
  if (!vid.success) return { blad: "Niepoprawna wieś." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(vid.data)) return { blad: "Brak uprawnień." };

  const { data: istniejacy } = await supabase
    .from("village_cemetery_plans")
    .select("id, name, is_published, virtual_candles_enabled, orthophoto_enabled, boundary_geojson, plan_data, gate_slug")
    .eq("village_id", vid.data)
    .maybeSingle();

  if (istniejacy) {
    return {
      ok: true,
      plan: {
        ...istniejacy,
        plan_data: parsujPlanCmentarza(istniejacy.plan_data),
      },
    };
  }

  const { data: wies } = await supabase.from("villages").select("name").eq("id", vid.data).maybeSingle();
  const { data: wstaw, error } = await supabase
    .from("village_cemetery_plans")
    .insert({
      village_id: vid.data,
      name: `Cmentarz — ${wies?.name ?? "wsi"}`,
      plan_data: szablonPlanuCmentarzaStartowy(),
      gate_slug: `cmentarz-${vid.data.slice(0, 8)}`,
    })
    .select("id, name, is_published, virtual_candles_enabled, orthophoto_enabled, boundary_geojson, plan_data, gate_slug")
    .single();

  if (error || !wstaw) return { blad: "Nie udało się utworzyć planu cmentarza." };
  return {
    ok: true,
    plan: { ...wstaw, plan_data: parsujPlanCmentarza(wstaw.plan_data) },
  };
}

export async function zapiszPlanCmentarza(
  planId: string,
  planData: unknown,
  meta?: { name?: string; is_published?: boolean; virtual_candles_enabled?: boolean; orthophoto_enabled?: boolean },
): Promise<Wynik> {
  const id = uuid.safeParse(planId);
  const parsed = schemaPlanCmentarza.safeParse(planData);
  if (!id.success || !parsed.success) return { blad: "Niepoprawne dane planu." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_cemetery_plans")
    .select("id, village_id, boundary_geojson")
    .eq("id", id.data)
    .maybeSingle();
  if (!row) return { blad: "Nie znaleziono planu." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(row.village_id)) return { blad: "Brak uprawnień." };

  let planDoZapisu = parsed.data;
  const boundary = row.boundary_geojson as GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  if (boundary?.type === "Polygon" || boundary?.type === "MultiPolygon") {
    const georef = georefZCmentarzaBoundary(boundary);
    if (georef) {
      planDoZapisu = {
        ...planDoZapisu,
        elementy: uzupelnijWspolrzedneGrobow(
          planDoZapisu.elementy.map((e) => ({ ...e, obrot: e.obrot ?? 0 })),
          georef,
        ),
      };
    }
  }

  const update: Record<string, unknown> = { plan_data: planDoZapisu };
  if (meta?.name != null) update.name = meta.name.trim();
  if (meta?.is_published != null) update.is_published = meta.is_published;
  if (meta?.virtual_candles_enabled != null) update.virtual_candles_enabled = meta.virtual_candles_enabled;
  if (meta?.orthophoto_enabled != null) update.orthophoto_enabled = meta.orthophoto_enabled;

  const { error } = await supabase.from("village_cemetery_plans").update(update).eq("id", id.data);
  if (error) return { blad: "Nie udało się zapisać planu." };

  if (boundary?.type === "Polygon" || boundary?.type === "MultiPolygon") {
    const georef = georefZCmentarzaBoundary(boundary);
    if (georef) {
      for (const el of planDoZapisu.elementy) {
        if (el.typ !== "grob" || !el.grave_record_id) continue;
        const elNorm = { ...el, obrot: el.obrot ?? 0 };
        const { lat, lng } = wspolrzedneElementuPlanu(elNorm, georef);
        await supabase
          .from("cemetery_grave_records")
          .update({ latitude: lat, longitude: lng })
          .eq("id", el.grave_record_id)
          .eq("cemetery_plan_id", id.data);
      }
    }
  }

  await revalidateCmentarz(supabase, row.village_id);
  return { ok: true };
}

export async function importujObrysCmentarzaZOsm(
  planId: string,
  promienM = 4000,
): Promise<Wynik & { nazwa?: string }> {
  const id = uuid.safeParse(planId);
  if (!id.success) return { blad: "Niepoprawny plan." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_cemetery_plans")
    .select("id, village_id, villages(latitude, longitude)")
    .eq("id", id.data)
    .maybeSingle();
  if (!row) return { blad: "Nie znaleziono planu." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(row.village_id)) return { blad: "Brak uprawnień." };

  const v = Array.isArray(row.villages) ? row.villages[0] : row.villages;
  const lat = v?.latitude != null ? Number(v.latitude) : NaN;
  const lon = v?.longitude != null ? Number(v.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { blad: "Brak GPS wsi — uzupełnij współrzędne w profilu wsi." };
  }

  const osm = await pobierzObrysyCmentarzyZOsm(lat, lon, promienM);
  if (!osm.ok) return { blad: osm.blad };
  if (!osm.obrysy.length) return { blad: "Nie znaleziono obrysu cmentarza w OSM w zasięgu." };

  const pierwszy = osm.obrysy[0]!;
  const { error } = await supabase
    .from("village_cemetery_plans")
    .update({
      boundary_geojson: pierwszy.geojson,
      name: pierwszy.name,
    })
    .eq("id", id.data);

  if (error) return { blad: "Nie udało się zapisać obrysu." };

  await revalidateCmentarz(supabase, row.village_id);
  return { ok: true, nazwa: pierwszy.name };
}

const schemaGrob = z.object({
  cemeteryPlanId: z.string().uuid(),
  nazwisko: z.string().trim().min(1).max(120),
  imie: z.string().trim().max(80).nullable().optional(),
  kwatera: z.string().trim().max(40).nullable().optional(),
  rzad: z.string().trim().max(40).nullable().optional(),
  numer_gravu: z.string().trim().max(40).nullable().optional(),
  rok_urodzenia: z.coerce.number().int().min(1600).max(2100).nullable().optional(),
  rok_smierci: z.coerce.number().int().min(1600).max(2100).nullable().optional(),
  notatka: z.string().trim().max(500).nullable().optional(),
  plan_element_id: z.string().uuid().nullable().optional(),
});

export async function dodajRekordGrobu(dane: z.infer<typeof schemaGrob>): Promise<Wynik & { id?: string }> {
  const p = schemaGrob.safeParse(dane);
  if (!p.success) return { blad: "Sprawdź dane grobu (nazwisko jest wymagane)." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: plan } = await supabase
    .from("village_cemetery_plans")
    .select("id, village_id")
    .eq("id", p.data.cemeteryPlanId)
    .maybeSingle();
  if (!plan) return { blad: "Brak planu cmentarza." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(plan.village_id)) return { blad: "Brak uprawnień." };

  const { data: wstaw, error } = await supabase
    .from("cemetery_grave_records")
    .insert({
      cemetery_plan_id: plan.id,
      nazwisko: p.data.nazwisko,
      imie: p.data.imie ?? null,
      kwatera: p.data.kwatera ?? null,
      rzad: p.data.rzad ?? null,
      numer_gravu: p.data.numer_gravu ?? null,
      rok_urodzenia: p.data.rok_urodzenia ?? null,
      rok_smierci: p.data.rok_smierci ?? null,
      notatka: p.data.notatka ?? null,
      plan_element_id: p.data.plan_element_id ?? null,
      status: "approved",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { blad: "Nie udało się dodać rekordu." };
  await revalidateCmentarz(supabase, plan.village_id);
  return { ok: true, id: wstaw?.id };
}

export async function importujGrobyCsv(
  cemeteryPlanId: string,
  csvText: string,
): Promise<Wynik & { dodano?: number; oczekuje?: number }> {
  const id = uuid.safeParse(cemeteryPlanId);
  if (!id.success) return { blad: "Niepoprawny plan." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: plan } = await supabase
    .from("village_cemetery_plans")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!plan) return { blad: "Brak planu." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(plan.village_id)) return { blad: "Brak uprawnień." };

  const linie = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linie.length < 2) return { blad: "CSV musi mieć nagłówek i co najmniej jeden wiersz." };

  const naglowek = linie[0]!.toLowerCase().split(/[;,]/).map((h) => h.trim());
  const idx = (k: string) => naglowek.findIndex((h) => h.includes(k));
  const iNazwisko = idx("nazwisko");
  if (iNazwisko < 0) return { blad: "Brak kolumny „nazwisko” w CSV." };

  const wiersze = [];
  for (let i = 1; i < linie.length && i <= 500; i++) {
    const kol = linie[i]!.split(/[;,]/).map((c) => c.trim());
    const nazwisko = kol[iNazwisko];
    if (!nazwisko) continue;
    const iUrodz = idx("urodzen");
    const iSmierc = idx("śmier") >= 0 ? idx("śmier") : idx("smier");
    wiersze.push({
      cemetery_plan_id: plan.id,
      nazwisko,
      imie: kol[idx("imie")] || kol[idx("imię")] || null,
      kwatera: kol[idx("kwatera")] || null,
      rzad: kol[idx("rzad")] || kol[idx("rząd")] || null,
      numer_gravu: kol[idx("numer")] || kol[idx("grób")] || kol[idx("grob")] || null,
      rok_urodzenia: iUrodz >= 0 && kol[iUrodz] ? Number(kol[iUrodz]) || null : null,
      rok_smierci: iSmierc >= 0 && kol[iSmierc] ? Number(kol[iSmierc]) || null : null,
      status: "pending" as const,
      created_by: user.id,
    });
  }

  if (!wiersze.length) return { blad: "Brak poprawnych wierszy w CSV." };

  const { error } = await supabase.from("cemetery_grave_records").insert(wiersze);
  if (error) return { blad: "Import CSV nie powiódł się." };

  await revalidateCmentarz(supabase, plan.village_id);
  return { ok: true, dodano: wiersze.length, oczekuje: wiersze.length };
}

export async function zatwierdzGrobyCsv(cemeteryPlanId: string): Promise<Wynik & { zatwierdzono?: number }> {
  const id = uuid.safeParse(cemeteryPlanId);
  if (!id.success) return { blad: "Niepoprawny plan." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: plan } = await supabase
    .from("village_cemetery_plans")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!plan) return { blad: "Brak planu." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(plan.village_id)) return { blad: "Brak uprawnień." };

  const { data, error } = await supabase
    .from("cemetery_grave_records")
    .update({ status: "approved", moderated_by: user.id, moderated_at: new Date().toISOString() })
    .eq("cemetery_plan_id", plan.id)
    .eq("status", "pending")
    .select("id");

  if (error) return { blad: "Nie udało się zatwierdzić." };
  await revalidateCmentarz(supabase, plan.village_id);
  return { ok: true, zatwierdzono: data?.length ?? 0 };
}

export async function zapalWirtualnyZnicz(
  cemeteryPlanId: string,
  graveRecordId?: string | null,
): Promise<Wynik & { liczba?: number }> {
  const id = uuid.safeParse(cemeteryPlanId);
  if (!id.success) return { blad: "Niepoprawny plan." };

  const supabase = utworzKlientaSupabaseSerwer();

  const { data: plan } = await supabase
    .from("village_cemetery_plans")
    .select("id, is_published, virtual_candles_enabled")
    .eq("id", id.data)
    .maybeSingle();

  if (!plan?.is_published || !plan.virtual_candles_enabled) {
    return { blad: "Wirtualne znicze są wyłączone." };
  }

  const { error } = await supabase.from("cemetery_virtual_candles").insert({
    cemetery_plan_id: plan.id,
    grave_record_id: graveRecordId && uuid.safeParse(graveRecordId).success ? graveRecordId : null,
  });
  if (error) return { blad: "Nie udało się zapalić znicza." };

  const { count } = await supabase
    .from("cemetery_virtual_candles")
    .select("id", { count: "exact", head: true })
    .eq("cemetery_plan_id", plan.id);

  return { ok: true, liczba: count ?? undefined };
}
