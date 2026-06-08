import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzLesnictwaBdlWokolPunktu } from "@/lib/geoportal/bdl-lasy-wfs";

export const dynamic = "force-dynamic";

async function pobierzLesnictwaCached(lat: number, lon: number, radiusM: number) {
  const klucz = `${lat.toFixed(3)}_${lon.toFixed(3)}_${Math.round(radiusM / 1000)}`;
  const fn = unstable_cache(
    async () => pobierzLesnictwaBdlWokolPunktu(lat, lon, radiusM),
    ["lesnictwa-bdl", klucz],
    { revalidate: 60 * 60 * 24 * 3, tags: [`lesnictwa-${klucz}`] },
  );
  return fn();
}

/** Granice leśnictw LP (BDL WFS) wokół punktu na mapie. */
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

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ blad: "Parametry lat i lon są wymagane." }, { status: 400 });
  }

  const wynik = await pobierzLesnictwaCached(lat, lon, radiusM);
  if (!wynik.ok) {
    return NextResponse.json({ blad: wynik.reason, retryable: wynik.retryable }, { status: 502 });
  }

  return NextResponse.json({
    obrysy: wynik.obrysy,
    zrodlo: "BDL / Lasy Państwowe",
    uwaga: "Granice leśnictw — warstwa orientacyjna z Banku Danych o Lasach.",
  });
}
