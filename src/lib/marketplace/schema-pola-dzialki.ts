import { z } from "zod";
import { walidujObszarPolowania } from "@/lib/lowiectwo/geojson-obszar";

const geoJsonDzialki = z
  .unknown()
  .nullable()
  .optional()
  .transform((v) => {
    if (v == null) return null;
    const poly = walidujObszarPolowania(v);
    if (poly) return poly;
    if (typeof v === "object" && v !== null && (v as { type?: string }).type === "MultiPolygon") {
      return v;
    }
    return null;
  });

export const schemaPolaDzialkiOgloszenia = z.object({
  parcelGeojson: geoJsonDzialki,
  parcelNumber: z.string().trim().max(80).optional().nullable(),
  cadastralDistrict: z.string().trim().max(120).optional().nullable(),
  parcelAreaM2: z.number().positive().max(50_000_000).nullable().optional(),
  geoportalParcelId: z.string().trim().max(200).optional().nullable(),
});

export type PolaDzialkiOgloszenia = z.infer<typeof schemaPolaDzialkiOgloszenia>;

export function mapujPolaDzialkiDoWiersza(p: PolaDzialkiOgloszenia) {
  return {
    parcel_geojson: p.parcelGeojson ?? null,
    parcel_number: p.parcelNumber?.length ? p.parcelNumber : null,
    cadastral_district: p.cadastralDistrict?.length ? p.cadastralDistrict : null,
    parcel_area_m2: p.parcelAreaM2 ?? null,
    geoportal_parcel_id: p.geoportalParcelId?.length ? p.geoportalParcelId : null,
  };
}
