import { z } from "zod";
import { dyscyplinaZPresetu } from "@/lib/wies/dyscypliny-sportowe";
import { metaOrganizacjiZFormularza, schemaMetaProfiluOrganizacji } from "@/lib/wies/profil-organizacji-meta";

export const schemaProfilKlubuSportowego = z.object({
  wersja: z.literal(1).default(1),
  dyscyplina: z.string().trim().max(120).nullable().optional(),
  trener: z.string().trim().max(160).nullable().optional(),
  strona_www: z.string().trim().max(500).nullable().optional(),
  facebook: z.string().trim().max(500).nullable().optional(),
  instagram: z.string().trim().max(500).nullable().optional(),
  strava: z.string().trim().max(500).nullable().optional(),
  dyscyplina_preset: z.string().trim().max(40).nullable().optional(),
  rekrutacja: z.string().trim().max(800).nullable().optional(),
  skladka: z.string().trim().max(300).nullable().optional(),
  stroje_kolory: z.string().trim().max(200).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
}).merge(schemaMetaProfiluOrganizacji);

export type ProfilKlubuSportowegoJson = z.infer<typeof schemaProfilKlubuSportowego>;

export function parsujProfilKlubuSportowego(raw: unknown): ProfilKlubuSportowegoJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaProfilKlubuSportowego.safeParse(raw);
  return w.success ? w.data : null;
}

export function profilKlubuSportowegoZFormularza(fd: FormData): ProfilKlubuSportowegoJson {
  const pole = (k: string) => {
    const t = String(fd.get(k) ?? "").trim();
    return t.length ? t : null;
  };
  const preset = String(fd.get("sport_dyscyplina_preset") ?? "").trim();
  const dyscyplinaWlasna = pole("sport_dyscyplina");
  const dyscyplina =
    preset && preset !== "inne"
      ? dyscyplinaZPresetu(preset, dyscyplinaWlasna ?? "")
      : dyscyplinaWlasna;

  return {
    wersja: 1,
    dyscyplina,
    dyscyplina_preset: preset || null,
    trener: pole("sport_trener"),
    strona_www: pole("sport_strona_www"),
    facebook: pole("sport_facebook"),
    instagram: pole("sport_instagram"),
    strava: pole("sport_strava"),
    rekrutacja: pole("sport_rekrutacja"),
    skladka: pole("sport_skladka"),
    stroje_kolory: pole("sport_stroje"),
    uwagi: pole("sport_uwagi"),
    ...metaOrganizacjiZFormularza(fd, "sport"),
  };
}

export function czyProfilKlubuSportowegoUzupelniony(p: ProfilKlubuSportowegoJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.dyscyplina?.trim() ||
      p.trener?.trim() ||
      p.rekrutacja?.trim() ||
      p.strona_www?.trim() ||
      p.strava?.trim(),
  );
}
