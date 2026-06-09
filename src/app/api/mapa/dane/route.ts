import { NextResponse } from "next/server";
import { wymagajLogowaniaApi } from "@/lib/auth/wymagaj-logowania-api";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzDaneMapyStrony, type OpcjeDaneMapyStrony } from "@/lib/mapa/pobierz-dane-mapy-strony";
import type { ZakresMapy } from "@/lib/mapa/pobierz-publiczne-dane-mapy";

export const dynamic = "force-dynamic";

function parsujZakres(raw: string | null): ZakresMapy {
  return raw === "polska" ? "polska" : "nakielski";
}

/** Dane mapy — faza rdzen (szybko) lub pelne; zakres nakielski (domyślnie) lub polska. */
export async function GET(request: Request) {
  const auth = await wymagajLogowaniaApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const opts: OpcjeDaneMapyStrony = {
    zakres: parsujZakres(searchParams.get("zakres")),
    faza: searchParams.get("faza") === "rdzen" ? "rdzen" : "pelne",
  };

  try {
    const user = await pobierzUzytkownikaSerwer();
    const dane = await pobierzDaneMapyStrony(user, opts);
    return NextResponse.json(dane, {
      headers: {
        "Cache-Control": "private, max-age=120, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Nie udało się wczytać mapy.";
    console.error("[api/mapa/dane]", msg);
    return NextResponse.json({ blad: msg }, { status: 500 });
  }
}
