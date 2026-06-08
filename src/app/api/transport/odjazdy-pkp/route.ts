import { NextResponse } from "next/server";
import { z } from "zod";
import { transportKolejWlaczony } from "@/lib/mapa/konfiguracja-automatyzacji";
import { ipZRequestu, sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import {
  linkRozkladPkpDlaStacji,
  pobierzOdjazdyDlaStacjiPkp,
  pobierzUtrudnieniaDlaStacjiPkp,
} from "@/lib/transport/pkp-plk-api";

const schema = z.object({
  stationId: z.string().trim().min(1).max(24),
  nazwa: z.string().trim().max(120).optional(),
});

export async function GET(request: Request) {
  if (!transportKolejWlaczony()) {
    return NextResponse.json({ odjazdy: [], utrudnienia: [], blad: "Transport PKP wyłączony." }, { status: 503 });
  }

  const limit = await sprawdzLimitApi("api_publiczne", ipZRequestu(request.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { odjazdy: [], utrudnienia: [], blad: `Za dużo zapytań. Spróbuj za ${limit.retryPoSekundach} s.` },
      { status: 429 },
    );
  }

  const params = new URL(request.url).searchParams;
  const parsed = schema.safeParse({
    stationId: params.get("stationId") ?? "",
    nazwa: params.get("nazwa") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ odjazdy: [], utrudnienia: [], blad: "Podaj stationId." }, { status: 400 });
  }

  try {
    const [odjazdy, utrudnienia] = await Promise.all([
      pobierzOdjazdyDlaStacjiPkp(parsed.data.stationId, { hoursAhead: 24 }),
      pobierzUtrudnieniaDlaStacjiPkp([parsed.data.stationId]),
    ]);
    const fmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });
    return NextResponse.json(
      {
        odjazdy: odjazdy.map((d) => {
          const delay = d.delayMinutes != null && d.delayMinutes > 0 ? ` (+${d.delayMinutes} min)` : "";
          return {
            czas: fmt.format(new Date(d.whenIso)) + delay,
            linia: d.trainLabel,
            cel: d.destination,
            peron: d.platform,
            anulowany: d.isCancelled,
            opoznienieMin: d.delayMinutes,
            planowany: d.plannedWhenIso,
            realtime: d.realtimeWhenIso,
          };
        }),
        utrudnienia: utrudnienia.map((u) => u.message),
        linkPkp: parsed.data.nazwa ? linkRozkladPkpDlaStacji(parsed.data.nazwa) : null,
        zrodlo: "pkp_plk",
        pobrano: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Błąd API PKP.";
    return NextResponse.json({ odjazdy: [], utrudnienia: [], blad: msg }, { status: 503 });
  }
}
