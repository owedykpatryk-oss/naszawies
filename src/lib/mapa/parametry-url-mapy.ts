const WZORZEC_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Id POI w URL (nie mylić z filtrem kategorii `poi=sklep`). */
export function czyWygladaNaUuidPoi(s: string | null | undefined): boolean {
  if (!s?.trim()) return false;
  return WZORZEC_UUID.test(s.trim());
}

/** Odczyt deep linku do pinezki POI: `poiId` lub legacy `poi=<uuid>`. */
export function odczytajIdPoiZParametrow(params: { get(name: string): string | null }): string | null {
  const poiId = params.get("poiId")?.trim();
  if (poiId && czyWygladaNaUuidPoi(poiId)) return poiId;
  const legacy = params.get("poi")?.trim();
  if (legacy && czyWygladaNaUuidPoi(legacy)) return legacy;
  return null;
}

/** Kategoria POI z `poi=` — tylko gdy to nie UUID. */
export function odczytajKategoriePoiZParametrow(params: { get(name: string): string | null }): string | null {
  const raw = params.get("poi")?.trim();
  if (!raw || czyWygladaNaUuidPoi(raw)) return null;
  return raw;
}
