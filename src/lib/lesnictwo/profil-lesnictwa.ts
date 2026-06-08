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

export const schemaProfilLesnictwa = z.object({
  nadlesnictwo: z.string().trim().max(200).nullable().optional(),
  lesnictwo: z.string().trim().max(200).nullable().optional(),
  kontakt_telefon: z.string().trim().max(40).nullable().optional(),
  kontakt_email: opcjonalnyEmail,
  godziny_lesniczowki: z.string().trim().max(500).nullable().optional(),
  sezon_choinek: z.string().trim().max(3000).nullable().optional(),
  link_choinki: schemaOpcjonalnegoLinkuHttp(500),
  drewno_opal: z.string().trim().max(3000).nullable().optional(),
  zasady_pobytu: z.string().trim().max(4000).nullable().optional(),
  uwagi_sezonowe: z.string().trim().max(3000).nullable().optional(),
  link_nadlesnictwo: schemaOpcjonalnegoLinkuHttp(500),
  zagrozenie_pozarowe: z.string().trim().max(2000).nullable().optional(),
});

export type ProfilLesnictwaJson = z.infer<typeof schemaProfilLesnictwa>;

export function parsujProfilLesnictwa(raw: unknown): ProfilLesnictwaJson | null {
  if (raw == null) return null;
  const w = schemaProfilLesnictwa.safeParse(raw);
  return w.success ? w.data : null;
}

export function profilLesnictwaZFormularza(fd: FormData): ProfilLesnictwaJson {
  const pole = (n: string) => {
    const v = fd.get(n);
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t.length > 0 ? t : null;
  };
  return {
    nadlesnictwo: pole("les_nadlesnictwo"),
    lesnictwo: pole("les_lesnictwo"),
    kontakt_telefon: pole("les_telefon"),
    kontakt_email: pole("les_email"),
    godziny_lesniczowki: pole("les_godziny"),
    sezon_choinek: pole("les_choinki"),
    link_choinki: pole("les_link_choinki"),
    drewno_opal: pole("les_drewno"),
    zasady_pobytu: pole("les_zasady"),
    uwagi_sezonowe: pole("les_uwagi"),
    link_nadlesnictwo: pole("les_link_lp"),
    zagrozenie_pozarowe: pole("les_pozar"),
  };
}

export function czyProfilLesnictwaUzupelniony(p: ProfilLesnictwaJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.nadlesnictwo?.trim() ||
      p.lesnictwo?.trim() ||
      p.sezon_choinek?.trim() ||
      p.drewno_opal?.trim() ||
      p.zasady_pobytu?.trim() ||
      p.kontakt_telefon?.trim() ||
      p.zagrozenie_pozarowe?.trim(),
  );
}
