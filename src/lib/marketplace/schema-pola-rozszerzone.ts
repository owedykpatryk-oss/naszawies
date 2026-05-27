import { z } from "zod";

/** Dodatkowe pola ogłoszenia (żywność, logistyka, mapa). */
export const schemaPolaRozszerzoneOgloszenia = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  pickupInVillage: z.boolean().optional().default(false),
  deliveryRadiusKm: z.number().min(0).max(150).nullable().optional(),
  seasonalNote: z.string().trim().max(200).optional().nullable(),
  productProducedAt: z.string().trim().max(12).optional().nullable(),
  productBestBefore: z.string().trim().max(12).optional().nullable(),
  isOrganic: z.boolean().optional().default(false),
  allergensText: z.string().trim().max(500).optional().nullable(),
  salesPoiId: z.string().uuid().nullable().optional(),
});

export type PolaRozszerzoneOgloszenia = z.infer<typeof schemaPolaRozszerzoneOgloszenia>;

export function mapujPolaRozszerzoneDoWiersza(p: PolaRozszerzoneOgloszenia) {
  const dataProdukcji = p.productProducedAt?.length ? p.productProducedAt : null;
  const termin = p.productBestBefore?.length ? p.productBestBefore : null;
  return {
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    pickup_in_village: p.pickupInVillage ?? false,
    delivery_radius_km: p.deliveryRadiusKm ?? null,
    seasonal_note: p.seasonalNote?.length ? p.seasonalNote : null,
    product_produced_at: dataProdukcji,
    product_best_before: termin,
    is_organic: p.isOrganic ?? false,
    allergens_text: p.allergensText?.length ? p.allergensText : null,
    sales_poi_id: p.salesPoiId ?? null,
  };
}
