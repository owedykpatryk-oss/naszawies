import { NextResponse } from "next/server";
import { z } from "zod";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { czyStravaSkonfigurowana, urlAutoryzacjiStrava } from "@/lib/strava/konfiguracja";
import { bezpiecznaSciezkaPowrotu, utworzStanOAuthStrava } from "@/lib/strava/stan-oauth";

export async function GET(request: Request) {
  if (!czyStravaSkonfigurowana()) {
    return NextResponse.redirect(new URL("/panel/mieszkaniec?strava=brak_konfiguracji", request.url));
  }

  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    const login = new URL("/logowanie", request.url);
    login.searchParams.set("next", new URL(request.url).pathname + new URL(request.url).search);
    return NextResponse.redirect(login);
  }

  const url = new URL(request.url);
  const villageId = z.string().uuid().safeParse(url.searchParams.get("villageId"));
  if (!villageId.success) {
    return NextResponse.json({ blad: "Brak poprawnego villageId." }, { status: 400 });
  }

  const returnTo = bezpiecznaSciezkaPowrotu(url.searchParams.get("returnTo"));
  const state = utworzStanOAuthStrava({
    userId: user.id,
    villageId: villageId.data,
    returnTo,
  });

  return NextResponse.redirect(urlAutoryzacjiStrava(state));
}
