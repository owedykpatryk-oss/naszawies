import { NextResponse } from "next/server";
import { pobierzStatystykiKataloguWsi } from "@/lib/landing/statystyki-katalogu-wsi";

/**
 * Zbiorcze liczniki katalogu (strona główna, partnerzy, raporty).
 */
export async function GET() {
  const stats = await pobierzStatystykiKataloguWsi();
  if (!stats) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  return NextResponse.json(
    {
      wsieLacznie: stats.wsieLacznie,
      wsieZAktywnymProfilem: stats.wsieZAktywnymProfilem,
      czas: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
