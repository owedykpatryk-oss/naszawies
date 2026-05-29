import {
  centroidGeometriiDzialki,
  obliczPowierzchnieGeometriiM2,
  wktDoGeojson,
  type GeoJsonGeometriiDzialki,
} from "@/lib/geoportal/wkt-do-geojson";

const ULDK_BASE = "https://uldk.gugik.gov.pl/";
const POLA_WYNIKU = "id,parcel,teryt,voivodeship,county,commune,region,geom_wkt";

export type WynikDzialkiUldk = {
  id: string;
  numer: string | null;
  obreb: string | null;
  teryt: string | null;
  wojewodztwo: string | null;
  powiat: string | null;
  gmina: string | null;
  geometria: GeoJsonGeometriiDzialki;
  powierzchniaM2: number | null;
  centroid: { lat: number; lng: number };
};

async function zapytajUldk(params: Record<string, string>): Promise<string> {
  const url = new URL(ULDK_BASE);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: "text/plain", "User-Agent": "NaszaWies/1.0 (marketplace-parcel)" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`ULDK HTTP ${res.status}`);
  }
  return res.text();
}

function parsujOdpowiedzUldk(tekst: string): string[] | null {
  const linie = tekst
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linie.length < 2) return null;
  const status = Number(linie[0]);
  if (status !== 0) return null;
  return linie[1]!.split("|");
}

function mapujPola(pola: string[], wartosci: string[]) {
  const map: Record<string, string> = {};
  for (let i = 0; i < pola.length; i++) {
    map[pola[i]!] = wartosci[i]?.trim() ?? "";
  }
  return map;
}

function zbudujWynik(map: Record<string, string>): WynikDzialkiUldk | null {
  const wkt = map.geom_wkt ?? map.geom ?? "";
  const geometria = wktDoGeojson(wkt);
  if (!geometria) return null;

  const centroid = centroidGeometriiDzialki(geometria);
  if (!centroid) return null;

  const powierzchniaM2 = obliczPowierzchnieGeometriiM2(geometria);

  return {
    id: map.id ?? map.teryt ?? "",
    numer: map.parcel?.length ? map.parcel : null,
    obreb: map.region?.length ? map.region : null,
    teryt: map.teryt?.length ? map.teryt : null,
    wojewodztwo: map.voivodeship?.length ? map.voivodeship : null,
    powiat: map.county?.length ? map.county : null,
    gmina: map.commune?.length ? map.commune : null,
    geometria,
    powierzchniaM2,
    centroid,
  };
}

/** Wyszukaj działkę po współrzędnych WGS84 (lon, lat). */
export async function pobierzDzialkePoWspolrzednych(lng: number, lat: number): Promise<WynikDzialkiUldk | null> {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < 13 || lng > 25 || lat < 48 || lat > 55) return null;

  const tekst = await zapytajUldk({
    request: "GetParcelByXY",
    xy: `${lng},${lat},4326`,
    srid: "4326",
    result: POLA_WYNIKU,
  });

  const wartosci = parsujOdpowiedzUldk(tekst);
  if (!wartosci) return null;

  const pola = POLA_WYNIKU.split(",");
  const map = mapujPola(pola, wartosci);
  return zbudujWynik(map);
}

/** Wyszukaj działkę po pełnym identyfikatorze ULDK (np. 141201_1.0001.6509). */
export async function pobierzDzialkePoId(id: string): Promise<WynikDzialkiUldk | null> {
  const idOk = id.trim();
  if (idOk.length < 5 || idOk.length > 120) return null;

  const tekst = await zapytajUldk({
    request: "GetParcelById",
    id: idOk,
    srid: "4326",
    result: POLA_WYNIKU,
  });

  const wartosci = parsujOdpowiedzUldk(tekst);
  if (!wartosci) return null;

  const pola = POLA_WYNIKU.split(",");
  const map = mapujPola(pola, wartosci);
  return zbudujWynik(map);
}
