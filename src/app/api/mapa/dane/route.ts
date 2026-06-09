import { NextResponse } from "next/server";
import { wymagajLogowaniaApi } from "@/lib/auth/wymagaj-logowania-api";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzDaneMapyStrony } from "@/lib/mapa/pobierz-dane-mapy-strony";

export const dynamic = "force-dynamic";

/** Pełne dane mapy — ładowane progresywnie po stronie klienta (mniejszy HTML, płynniejszy start). */
export async function GET() {
  const auth = await wymagajLogowaniaApi();
  if (!auth.ok) return auth.response;

  try {
    const user = await pobierzUzytkownikaSerwer();
    const dane = await pobierzDaneMapyStrony(user);
    return NextResponse.json(dane, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Nie udało się wczytać mapy.";
    console.error("[api/mapa/dane]", msg);
    return NextResponse.json({ blad: msg }, { status: 500 });
  }
}
