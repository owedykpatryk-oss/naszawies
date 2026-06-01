import { NextResponse } from "next/server";
import { pobierzKalendarzSoltysa } from "@/lib/kalendarz/pobierz-kalendarz-soltysa";
import { utworzPlikIcsWiele, type WpisIcs } from "@/lib/kalendarz/utworz-plik-ics";
import { ETYKIETA_RODZAJU } from "@/lib/kalendarz/typy-kalendarza";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

function miesiacZParam(miesiac: string | null): string {
  const teraz = new Date();
  if (miesiac && /^\d{4}-\d{2}$/.test(miesiac)) return miesiac;
  return `${teraz.getFullYear()}-${String(teraz.getMonth() + 1).padStart(2, "0")}`;
}

function zakresMiesiaca(ym: string): { od: Date; doDaty: Date } {
  const [y, m] = ym.split("-").map(Number);
  return {
    od: new Date(y!, m! - 1, 1, 0, 0, 0, 0),
    doDaty: new Date(y!, m!, 0, 23, 59, 59, 999),
  };
}

export async function GET(request: Request) {
  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) {
    return NextResponse.json({ blad: "Brak autoryzacji." }, { status: 401 });
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return NextResponse.json({ blad: "Brak wsi." }, { status: 403 });
  }

  const url = new URL(request.url);
  const miesiac = miesiacZParam(url.searchParams.get("miesiac"));
  const { od, doDaty } = zakresMiesiaca(miesiac);
  const kalendarz = await pobierzKalendarzSoltysa(supabase, villageIds, od, doDaty);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://naszawies.pl";

  const wydarzenia: WpisIcs[] = kalendarz.wpisy
    .filter((w) => w.rodzaj !== "gmina")
    .map((w) => ({
      uid: w.id.replace(/[^a-zA-Z0-9-]/g, "-"),
      title: `[${ETYKIETA_RODZAJU[w.rodzaj]}] ${w.tytul} (${w.wiesNazwa})`,
      description: w.opis ?? undefined,
      location: w.wiesNazwa,
      startAt: new Date(w.start),
      endAt: w.end ? new Date(w.end) : w.calodniowe ? new Date(new Date(w.start).getTime() + 24 * 60 * 60 * 1000) : null,
      url: w.href?.startsWith("/") ? `${baseUrl}${w.href}` : w.href ?? undefined,
    }));

  const ics = utworzPlikIcsWiele(wydarzenia, `Kalendarz sołtysa ${miesiac}`);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="kalendarz-soltys-${miesiac}.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
