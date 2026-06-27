import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import {
  pobierzGraniceAdministracyjnePrg,
  type PoziomGranicyAdministracyjnej,
} from "@/lib/geoportal/prg-wfs-client";

export const dynamic = "force-dynamic";

const DOZWOLONE_POZIOMY = new Set<PoziomGranicyAdministracyjnej>(["woj", "powiat", "gmina"]);

function czyPoziom(v: string | null): v is PoziomGranicyAdministracyjnej {
  return v != null && DOZWOLONE_POZIOMY.has(v as PoziomGranicyAdministracyjnej);
}

async function pobierzGraniceAdminCached(poziom: PoziomGranicyAdministracyjnej, teryt: string) {
  const fn = unstable_cache(
    async () => {
      const wynik = await pobierzGraniceAdministracyjnePrg(poziom, teryt);
      if (!wynik.ok) {
        throw new Error(wynik.reason);
      }
      return wynik;
    },
    [`granice-admin-prg-v2`, poziom, teryt],
    { revalidate: 60 * 60 * 24 * 7, tags: [`granice-admin-${poziom}-${teryt}`] },
  );
  try {
    return await fn();
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { ok: false as const, reason, retryable: true };
  }
}

/** Urzędowa granica województwa / powiatu / gminy z PRG WFS (Geoportal). */
export async function GET(req: Request) {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    return NextResponse.json({ blad: "Zaloguj się." }, { status: 401 });
  }

  const url = new URL(req.url);
  const poziomRaw = url.searchParams.get("poziom")?.trim().toLowerCase() ?? "";
  const teryt = url.searchParams.get("teryt")?.trim() ?? "";

  if (!czyPoziom(poziomRaw)) {
    return NextResponse.json(
      { blad: "Parametr poziom musi być: woj, powiat lub gmina." },
      { status: 400 },
    );
  }
  if (!teryt) {
    return NextResponse.json({ blad: "Parametr teryt jest wymagany." }, { status: 400 });
  }

  const wynik = await pobierzGraniceAdminCached(poziomRaw, teryt);
  if (!wynik.ok) {
    return NextResponse.json(
      { blad: wynik.reason, retryable: wynik.retryable },
      { status: wynik.retryable ? 502 : 404 },
    );
  }

  return NextResponse.json({
    poziom: poziomRaw,
    teryt,
    geojson: wynik.boundaryGeojson,
    zrodlo: "PRG / Geoportal",
    warstwa: wynik.sourceTypeName,
    uwaga:
      poziomRaw === "gmina"
        ? "Granica administracyjna gminy (TERC) — nie mylić z obrębem ewidencyjnym wsi."
        : "Granica administracyjna z Państwowego Rejestru Granic.",
  });
}
