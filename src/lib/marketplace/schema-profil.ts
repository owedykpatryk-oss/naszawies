import { z } from "zod";
import { RODZAJE_PROFILU_RYNKU } from "@/lib/marketplace/rodzaj-profilu-rynku";

export const schemaMarketplaceProfil = z.object({
  villageId: z.string().uuid(),
  profile_kind: z.enum(RODZAJE_PROFILU_RYNKU).optional().default("firma"),
  business_name: z.string().trim().min(2).max(160),
  short_description: z.string().trim().max(600).nullable().optional(),
  details: z.string().trim().max(5000).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(200).nullable().optional(),
  website: z.string().trim().max(2048).nullable().optional(),
  categories_csv: z.string().trim().max(500).optional().default(""),
  service_area: z.string().trim().max(200).nullable().optional(),
});
