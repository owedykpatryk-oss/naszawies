import { z } from "zod";

/** Dozwolone tylko http(s) — blokuje javascript:, data: itp. */
export function bezpiecznyLinkHttp(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/** Opcjonalny link w formularzach (pusty → null, inaczej tylko http/https). */
export function schemaOpcjonalnegoLinkuHttp(maxDlugosc = 500) {
  return z
    .string()
    .trim()
    .max(maxDlugosc)
    .nullable()
    .optional()
    .superRefine((v, ctx) => {
      if (!v?.trim()) return;
      if (!bezpiecznyLinkHttp(v)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dozwolone są tylko adresy http:// lub https://." });
      }
    })
    .transform((v) => {
      if (!v?.trim()) return null;
      return bezpiecznyLinkHttp(v);
    });
}
