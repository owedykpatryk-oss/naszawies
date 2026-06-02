import { z } from "zod";

/** Wspólne pola wizualne mini-strony organizacji — w `profile_data`. */
export const schemaMetaProfiluOrganizacji = z.object({
  okladka_url: z.string().trim().max(2000).nullable().optional(),
  haslo: z.string().trim().max(120).nullable().optional(),
});

export type MetaProfiluOrganizacji = z.infer<typeof schemaMetaProfiluOrganizacji>;

function tekstPola(raw: unknown, klucz: keyof MetaProfiluOrganizacji): string | null {
  if (raw == null || typeof raw !== "object") return null;
  const v = (raw as Record<string, unknown>)[klucz];
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export function okladkaOrganizacjiZProfilu(raw: unknown): string | null {
  const url = tekstPola(raw, "okladka_url");
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

export function hasloOrganizacjiZProfilu(raw: unknown): string | null {
  return tekstPola(raw, "haslo");
}

export function metaOrganizacjiZFormularza(fd: FormData, prefix: string): MetaProfiluOrganizacji {
  const pole = (k: string) => {
    const t = String(fd.get(k) ?? "").trim();
    return t.length ? t : null;
  };
  return {
    okladka_url: pole(`${prefix}_okladka_url`),
    haslo: pole(`${prefix}_haslo`),
  };
}
