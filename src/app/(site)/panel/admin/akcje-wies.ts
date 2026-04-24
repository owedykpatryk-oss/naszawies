"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import slugify from "slugify";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const zod = z.object({
  terytId: z.string().trim().min(4).max(20),
  nazwa: z.string().trim().min(2).max(200),
  wojewodztwo: z.string().trim().min(2).max(100),
  powiat: z.string().trim().min(2).max(100),
  gmina: z.string().trim().min(2).max(100),
  typGminy: z.string().trim().min(2).max(80).optional(),
  emailSoltysa: z.string().trim().email("Podaj poprawny e-mail sołtysa (konto w serwisie)."),
  slugReczny: z.string().trim().max(120).optional().nullable(),
  latitude: z.coerce.number().min(49).max(55).optional().nullable(),
  longitude: z.coerce.number().min(14).max(25).optional().nullable(),
  population: z.coerce.number().int().min(0).max(2_000_000).optional().nullable(),
});

export type WynikAdminWies = { blad: string } | { ok: true; villageId: string };

function slugZNazwy(nazwa: string, reczny: string | null | undefined): string {
  const r = reczny?.trim();
  if (r) {
    return slugify(r, { lower: true, strict: true, locale: "pl" });
  }
  return slugify(nazwa, { lower: true, strict: true, locale: "pl" });
}

export async function adminUtworzWiesISoltysa(niesprawdzone: unknown): Promise<WynikAdminWies> {
  const p = zod.safeParse(niesprawdzone);
  if (!p.success) {
    return { blad: p.error.issues[0]?.message ?? "Sprawdź dane formularza." };
  }
  const x = p.data;
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const slug = slugZNazwy(x.nazwa, x.slugReczny);
  const typGminy = x.typGminy?.length ? x.typGminy : "gmina_miejsko_wiejska";

  const { data, error } = await supabase.rpc("admin_utworz_wies_i_soltysa", {
    p_teryt_id: x.terytId.trim(),
    p_name: x.nazwa,
    p_slug: slug,
    p_voivodeship: x.wojewodztwo,
    p_county: x.powiat,
    p_commune: x.gmina,
    p_commune_type: typGminy,
    p_soltys_email: x.emailSoltysa.trim().toLowerCase(),
    p_latitude: x.latitude ?? null,
    p_longitude: x.longitude ?? null,
    p_population: x.population ?? null,
  });

  if (error) {
    const m = error.message;
    if (m.includes("Brak uprawnień") || m.includes("42501")) {
      return { blad: "To konto nie ma uprawnień administratora platformy." };
    }
    if (m.includes("Nie znaleziono użytkownika")) {
      return { blad: "Nie ma konta z tym e-mailem — sołtys musi najpierw założyć konto w serwisie." };
    }
    if (m.includes("już w bazie")) {
      return {
        blad: "Ta miejscowość (ten kod) jest już w serwisie. Wyszukaj ją w wyszukiwarce miejscowości i w razie potrzeby skontaktuj się z administratorem platformy.",
      };
    }
    if (m.includes("duplicate key") || m.includes("unique")) {
      return { blad: "Konflikt unikalności (kod, albo ten sam sołtys) — sprawdź dane i TERYT." };
    }
    return { blad: m || "Nie udało się zapisać." };
  }

  const villageId = typeof data === "string" ? data : (data as string | null);
  if (!villageId) {
    return { blad: "Brak identyfikatora nowej wsi." };
  }

  revalidatePath("/panel/admin");
  revalidatePath("/szukaj");
  revalidatePath("/mapa");
  return { ok: true, villageId };
}
