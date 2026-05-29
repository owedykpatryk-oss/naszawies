import { NextResponse } from "next/server";
import { z } from "zod";
import { pobierzDzialkePoId, pobierzDzialkePoWspolrzednych } from "@/lib/geoportal/uldk-client";
import { wymagajLogowaniaApi } from "@/lib/auth/wymagaj-logowania-api";

const schemaWsp = z.object({
  lng: z.number().min(13).max(25),
  lat: z.number().min(48).max(55),
});

const schemaId = z.object({
  parcelId: z.string().trim().min(5).max(120),
});

export async function POST(req: Request) {
  const auth = await wymagajLogowaniaApi();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ blad: "Niepoprawne JSON." }, { status: 400 });
  }

  const poId = schemaId.safeParse(body);
  if (poId.success) {
    try {
      const wynik = await pobierzDzialkePoId(poId.data.parcelId);
      if (!wynik) {
        return NextResponse.json({ blad: "Nie znaleziono działki w Geoportalu (ULDK)." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, dzialka: wynik });
    } catch (e) {
      console.error("[geoportal/dzialka]", e);
      return NextResponse.json({ blad: "Geoportal chwilowo niedostępny." }, { status: 503 });
    }
  }

  const poWsp = schemaWsp.safeParse(body);
  if (poWsp.success) {
    try {
      const wynik = await pobierzDzialkePoWspolrzednych(poWsp.data.lng, poWsp.data.lat);
      if (!wynik) {
        return NextResponse.json({ blad: "Brak działki w tym punkcie — kliknij w obrębie granicy działki." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, dzialka: wynik });
    } catch (e) {
      console.error("[geoportal/dzialka]", e);
      return NextResponse.json({ blad: "Geoportal chwilowo niedostępny." }, { status: 503 });
    }
  }

  return NextResponse.json({ blad: "Podaj lng+lat albo parcelId." }, { status: 400 });
}
