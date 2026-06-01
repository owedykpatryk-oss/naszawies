import { z } from "zod";
import { RODZAJE_PRZYPOMNIENIA } from "@/lib/przypomnienia/rodzaje";
import { bezpiecznaSciezkaWzgledna, bezpiecznyHref } from "@/lib/tekst/bezpieczny-url";

const linkPrzypomnienia = z
  .string()
  .trim()
  .max(2048)
  .nullable()
  .optional()
  .refine(
    (v) => {
      if (!v?.length) return true;
      return bezpiecznyHref(v) != null || bezpiecznaSciezkaWzgledna(v) != null;
    },
    { message: "Link musi być https://… lub ścieżką w serwisie (/…)." },
  );

export const schemaRegulaPrzypomnienia = z
  .object({
    villageId: z.string().uuid(),
    kind: z.enum(RODZAJE_PRZYPOMNIENIA),
    title: z.string().trim().min(2).max(160),
    body: z.string().trim().max(2000).nullable().optional(),
    recurrence: z.enum(["weekly", "monthly", "yearly"]),
    day_of_week: z.coerce.number().int().min(0).max(6).nullable().optional(),
    day_of_month: z.coerce.number().int().min(1).max(31).nullable().optional(),
    month: z.coerce.number().int().min(1).max(12).nullable().optional(),
    days_before: z.coerce.number().int().min(0).max(60).default(1),
  link_url: linkPrzypomnienia,
})
  .superRefine((d, ctx) => {
    if (d.recurrence === "weekly" && d.day_of_week == null) {
      ctx.addIssue({ code: "custom", message: "Wybierz dzień tygodnia.", path: ["day_of_week"] });
    }
    if (d.recurrence === "monthly" && d.day_of_month == null) {
      ctx.addIssue({ code: "custom", message: "Podaj dzień miesiąca.", path: ["day_of_month"] });
    }
    if (d.recurrence === "yearly" && (d.month == null || d.day_of_month == null)) {
      ctx.addIssue({ code: "custom", message: "Podaj miesiąc i dzień.", path: ["month"] });
    }
  });

export const schemaPreferencjePrzypomnien = z.object({
  villageId: z.string().uuid(),
  notify_smieci: z.boolean(),
  notify_podatek: z.boolean(),
  notify_dzialka: z.boolean(),
  notify_pszok: z.boolean(),
  notify_inne: z.boolean(),
});
