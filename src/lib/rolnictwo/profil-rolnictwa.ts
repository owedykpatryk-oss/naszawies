import { z } from "zod";
import { schemaOpcjonalnegoLinkuHttp } from "@/lib/bezpieczenstwo/link-zewnetrzny";

const opcjonalnyEmail = z
  .string()
  .trim()
  .max(120)
  .nullable()
  .optional()
  .superRefine((v, ctx) => {
    if (!v?.trim()) return;
    if (!z.string().email().safeParse(v).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Niepoprawny adres e-mail." });
    }
  })
  .transform((v) => (v?.trim() ? v.trim() : null));

export const schemaProfilRolnictwa = z.object({
  kontakt_arimr: z.string().trim().max(500).nullable().optional(),
  kontakt_odr: z.string().trim().max(500).nullable().optional(),
  biuro_obslugi: z.string().trim().max(500).nullable().optional(),
  kontakt_telefon: z.string().trim().max(40).nullable().optional(),
  kontakt_email: opcjonalnyEmail,
  terminy_doplaty: z.string().trim().max(3000).nullable().optional(),
  skup_zboz: z.string().trim().max(2000).nullable().optional(),
  skup_mleko: z.string().trim().max(2000).nullable().optional(),
  odbior_opakowan: z.string().trim().max(2000).nullable().optional(),
  link_ewniosekplus: schemaOpcjonalnegoLinkuHttp(500),
  link_krap: schemaOpcjonalnegoLinkuHttp(500),
  ostrzezenie_susza: z.string().trim().max(2000).nullable().optional(),
  choroby_zwierzat: z.string().trim().max(2000).nullable().optional(),
  uwagi_sezonowe: z.string().trim().max(3000).nullable().optional(),
});

export type ProfilRolnictwaJson = z.infer<typeof schemaProfilRolnictwa>;

export function parsujProfilRolnictwa(raw: unknown): ProfilRolnictwaJson | null {
  if (raw == null) return null;
  const w = schemaProfilRolnictwa.safeParse(raw);
  return w.success ? w.data : null;
}

export function profilRolnictwaZFormularza(fd: FormData): ProfilRolnictwaJson {
  const pole = (n: string) => {
    const v = fd.get(n);
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t.length > 0 ? t : null;
  };
  return {
    kontakt_arimr: pole("rol_arimr"),
    kontakt_odr: pole("rol_odr"),
    biuro_obslugi: pole("rol_biuro"),
    kontakt_telefon: pole("rol_telefon"),
    kontakt_email: pole("rol_email"),
    terminy_doplaty: pole("rol_doplaty"),
    skup_zboz: pole("rol_skup_zboz"),
    skup_mleko: pole("rol_skup_mleko"),
    odbior_opakowan: pole("rol_opakowania"),
    link_ewniosekplus: pole("rol_ewniosek"),
    link_krap: pole("rol_krap"),
    ostrzezenie_susza: pole("rol_susza"),
    choroby_zwierzat: pole("rol_choroby"),
    uwagi_sezonowe: pole("rol_uwagi"),
  };
}

export function czyProfilRolnictwaUzupelniony(p: ProfilRolnictwaJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.kontakt_arimr?.trim() ||
      p.kontakt_odr?.trim() ||
      p.terminy_doplaty?.trim() ||
      p.skup_zboz?.trim() ||
      p.skup_mleko?.trim() ||
      p.ostrzezenie_susza?.trim() ||
      p.kontakt_telefon?.trim(),
  );
}
