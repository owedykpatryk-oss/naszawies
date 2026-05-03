import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const teryt = z
  .string()
  .trim()
  .regex(/^[0-9]{7}$/, "Podaj 7-cyfrowy identyfikator SIMC (teryt_id), np. 0088390.");

/**
 * Jedna wieś po `teryt_id` — integracje z rejestrami TERYT/SIMC, linkowniki gminne.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = teryt.safeParse(searchParams.get("id") ?? "");
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Niepoprawny identyfikator.";
    return NextResponse.json({ blad: msg }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("villages")
    .select(
      "id, name, slug, voivodeship, county, commune, commune_type, teryt_id, latitude, longitude, is_active, population, description",
    )
    .eq("teryt_id", parsed.data)
    .maybeSingle();

  if (error) {
    console.error("[api/wies/wg-teryt]", error.message);
    return NextResponse.json({ blad: "Błąd odczytu katalogu." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ blad: "Nie znaleziono wsi o podanym teryt_id." }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    nazwa: data.name,
    slug: data.slug,
    wojewodztwo: data.voivodeship,
    powiat: data.county,
    gmina: data.commune,
    typGminy: data.commune_type,
    terytId: data.teryt_id,
    aktywnyProfil: data.is_active,
    szerokosc: data.latitude != null ? Number(data.latitude) : null,
    dlugosc: data.longitude != null ? Number(data.longitude) : null,
    ludnosc: data.population,
    opisSkrocony: data.description ? String(data.description).slice(0, 280) : null,
    sciezka: sciezkaProfiluWsi({
      voivodeship: data.voivodeship,
      county: data.county,
      commune: data.commune,
      slug: data.slug,
    }),
  });
}
