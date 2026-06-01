import { NextResponse } from "next/server";
import { pobierzLanduseZOsmWokolPunktu } from "@/lib/mapa/overpass-landuse-dla-punktu";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";

export const dynamic = "force-dynamic";

/** Obrysy landuse z OSM wokół punktu (warstwa zagospodarowania na mapie wsi). */
export async function GET(req: Request) {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    return NextResponse.json({ blad: "Zaloguj się." }, { status: 401 });
  }

  const url = new URL(req.url);
  const lat = Number.parseFloat(url.searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(url.searchParams.get("lon") ?? "");
  const radiusRaw = Number.parseInt(url.searchParams.get("radiusM") ?? "2800", 10);
  const radiusM = Number.isFinite(radiusRaw) ? radiusRaw : 2800;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ blad: "Parametry lat i lon są wymagane." }, { status: 400 });
  }

  const wynik = await pobierzLanduseZOsmWokolPunktu(lat, lon, radiusM);
  if (!wynik.ok) {
    return NextResponse.json({ blad: wynik.blad }, { status: 502 });
  }

  return NextResponse.json({
    obrysy: wynik.obrysy.map((o) => ({
      id: `lu-${o.osmId}`,
      landuse: o.landuse,
      name: o.name,
      geojson: o.geojson,
    })),
    zrodlo: "OpenStreetMap",
    uwaga: "Warstwa orientacyjna — nie zastępuje planu miejscowego gminy.",
  });
}
