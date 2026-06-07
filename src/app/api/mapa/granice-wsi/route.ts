import { NextResponse } from "next/server";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export const dynamic = "force-dynamic";

/** Obrysy wsi z bazy (PRG) — batch po id, max 60 na żądanie. */
export async function GET(req: Request) {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    return NextResponse.json({ blad: "Zaloguj się." }, { status: 401 });
  }

  const url = new URL(req.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 60);

  if (ids.length === 0) {
    return NextResponse.json({ blad: "Parametr ids jest wymagany." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Baza niedostępna." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("villages")
    .select("id, boundary_geojson, boundary_source")
    .in("id", ids)
    .not("boundary_geojson", "is", null);

  if (error) {
    return NextResponse.json({ blad: error.message }, { status: 500 });
  }

  const granice: Record<string, unknown> = {};
  const zrodla: Record<string, string | null> = {};
  for (const row of data ?? []) {
    const zrodlo = (row.boundary_source as string | null) ?? "";
    if (zrodlo.endsWith("_gmina")) continue;
    if (row.boundary_geojson) {
      granice[row.id as string] = row.boundary_geojson;
      zrodla[row.id as string] = zrodlo || null;
    }
  }

  return NextResponse.json({
    granice,
    zrodla,
    liczba: Object.keys(granice).length,
    uwaga: "Obrys z PRG — zwykle obręb ewidencyjny wokół punktu GPS wsi.",
  });
}
