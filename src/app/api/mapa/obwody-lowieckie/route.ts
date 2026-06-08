import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzObwodyLowieckieWokolPunktu } from "@/lib/geoportal/obwody-lowieckie-wfs";

export const dynamic = "force-dynamic";

async function pobierzObwodyCached(
  lat: number,
  lon: number,
  radiusM: number,
  wojSlug: string | null,
) {
  const klucz = `${wojSlug ?? "brak"}_${lat.toFixed(3)}_${lon.toFixed(3)}_${Math.round(radiusM / 1000)}`;
  const fn = unstable_cache(
    async () => pobierzObwodyLowieckieWokolPunktu(lat, lon, radiusM, wojSlug),
    ["obwody-lowieckie", klucz],
    { revalidate: 60 * 60 * 24 * 7, tags: [`obwody-${klucz}`] },
  );
  return fn();
}

/** Urzędowe granice obwodów łowieckich (OpenForestData) wokół punktu na mapie. */
export async function GET(req: Request) {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    return NextResponse.json({ blad: "Zaloguj się." }, { status: 401 });
  }

  const url = new URL(req.url);
  const lat = Number.parseFloat(url.searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(url.searchParams.get("lon") ?? "");
  const radiusRaw = Number.parseInt(url.searchParams.get("radiusM") ?? "35000", 10);
  const radiusM = Number.isFinite(radiusRaw) ? radiusRaw : 35_000;
  const wojSlug = url.searchParams.get("woj")?.trim() || null;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ blad: "Parametry lat i lon są wymagane." }, { status: 400 });
  }

  const wynik = await pobierzObwodyCached(lat, lon, radiusM, wojSlug);
  if (!wynik.ok) {
    return NextResponse.json({ blad: wynik.reason, retryable: wynik.retryable }, { status: 502 });
  }

  return NextResponse.json({
    obrysy: wynik.obrysy,
    wojSlug: wynik.wojSlug,
    zrodlo: "OpenForestData (CC0)",
    uwaga: "Granice obwodów łowieckich — dane referencyjne PZŁ, warstwa orientacyjna.",
  });
}
