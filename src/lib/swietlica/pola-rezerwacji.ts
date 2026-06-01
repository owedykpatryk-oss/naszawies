import { z } from "zod";

export type TypPolaRezerwacji = "text" | "textarea" | "number" | "checkbox" | "select";

export type PoleRezerwacjiSali = {
  id: string;
  label: string;
  typ: TypPolaRezerwacji;
  wymagane: boolean;
  placeholder: string | null;
  opcje: string[] | null;
  maxLength: number | null;
};

const schemaPole = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(120),
  typ: z.enum(["text", "textarea", "number", "checkbox", "select"]),
  wymagane: z.boolean().optional().default(false),
  placeholder: z.string().trim().max(200).nullable().optional(),
  opcje: z.array(z.string().trim().min(1).max(80)).max(12).nullable().optional(),
  maxLength: z.number().int().min(1).max(2000).nullable().optional(),
});

export const schemaPolaRezerwacjiSali = z.array(schemaPole).max(8);

export function parsujPolaRezerwacjiSali(raw: unknown): PoleRezerwacjiSali[] {
  const w = schemaPolaRezerwacjiSali.safeParse(raw ?? []);
  if (!w.success) return [];
  return w.data.map((p) => ({
    id: p.id,
    label: p.label,
    typ: p.typ,
    wymagane: p.wymagane === true,
    placeholder: p.placeholder?.trim() || null,
    opcje: p.typ === "select" ? (p.opcje ?? []).filter(Boolean).slice(0, 12) : null,
    maxLength: p.maxLength ?? null,
  }));
}

export function nowePoleRezerwacji(): PoleRezerwacjiSali {
  return {
    id: `pole-${Date.now()}`,
    label: "",
    typ: "text",
    wymagane: false,
    placeholder: null,
    opcje: null,
    maxLength: null,
  };
}

export const schemaOdpowiedziRezerwacji = z.record(z.string(), z.union([z.string(), z.boolean(), z.number()]));

export function walidujOdpowiedziRezerwacji(
  pola: PoleRezerwacjiSali[],
  raw: Record<string, unknown>,
): { ok: true; dane: Record<string, string | boolean | number> } | { ok: false; blad: string } {
  const out: Record<string, string | boolean | number> = {};
  for (const pole of pola) {
    const v = raw[pole.id];
    if (pole.typ === "checkbox") {
      out[pole.id] = v === true || v === "true" || v === "on";
      if (pole.wymagane && out[pole.id] !== true) {
        return { ok: false, blad: `Pole „${pole.label}” jest wymagane.` };
      }
      continue;
    }
    if (pole.typ === "number") {
      const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
      if (!Number.isFinite(n)) {
        if (pole.wymagane) return { ok: false, blad: `Pole „${pole.label}” jest wymagane.` };
        continue;
      }
      out[pole.id] = n;
      continue;
    }
    const s = String(v ?? "").trim();
    if (!s) {
      if (pole.wymagane) return { ok: false, blad: `Pole „${pole.label}” jest wymagane.` };
      continue;
    }
    const max = pole.maxLength ?? (pole.typ === "textarea" ? 2000 : 500);
    if (s.length > max) {
      return { ok: false, blad: `Pole „${pole.label}” jest za długie (max ${max} znaków).` };
    }
    if (pole.typ === "select" && pole.opcje?.length && !pole.opcje.includes(s)) {
      return { ok: false, blad: `Wybierz poprawną opcję w polu „${pole.label}”.` };
    }
    out[pole.id] = s;
  }
  return { ok: true, dane: out };
}

export function etykietaOdpowiedziRezerwacji(pole: PoleRezerwacjiSali, wartosc: unknown): string {
  if (pole.typ === "checkbox") return wartosc === true ? "Tak" : "Nie";
  if (wartosc == null || wartosc === "") return "—";
  return String(wartosc);
}
