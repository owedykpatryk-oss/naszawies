import { NextResponse } from "next/server";
import { zapiszPolaczeniePoKodzie } from "@/lib/strava/token-store";
import { bezpiecznaSciezkaPowrotu, zweryfikujStanOAuthStrava } from "@/lib/strava/stan-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const blad = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");

  const stan = zweryfikujStanOAuthStrava(stateRaw);
  const fallback = stan ? bezpiecznaSciezkaPowrotu(stan.returnTo) : "/panel/mieszkaniec";

  if (blad) {
    const zwr = new URL(fallback, url.origin);
    zwr.searchParams.set("strava", "odmowa");
    return NextResponse.redirect(zwr);
  }

  if (!code || !stan) {
    const zwr = new URL(fallback, url.origin);
    zwr.searchParams.set("strava", "blad_stanu");
    return NextResponse.redirect(zwr);
  }

  try {
    await zapiszPolaczeniePoKodzie(stan.userId, code);
    const zwr = new URL(fallback, url.origin);
    zwr.searchParams.set("strava", "polaczono");
    if (stan.villageId) zwr.hash = "sekcja-sport";
    return NextResponse.redirect(zwr);
  } catch {
    const zwr = new URL(fallback, url.origin);
    zwr.searchParams.set("strava", "blad_token");
    return NextResponse.redirect(zwr);
  }
}
