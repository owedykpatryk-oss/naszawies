import { z } from "zod";

export const KLUCZE_DOLNEJ_NAWIGACJI = [
  "panel",
  "rynek",
  "mapa",
  "szukaj",
  "moje",
  "czat",
  "powiadomienia",
  "pomoc",
  "logowanie",
] as const;

export type KluczDolnejNawigacji = (typeof KLUCZE_DOLNEJ_NAWIGACJI)[number];

export const ETYKIETY_DOLNEJ_NAWIGACJI: Record<
  KluczDolnejNawigacji,
  { href: string; label: string; tylkoZalogowany?: boolean; tylkoPubliczny?: boolean }
> = {
  panel: { href: "/panel", label: "Konto", tylkoZalogowany: true },
  rynek: { href: "/rynek", label: "Rynek" },
  mapa: { href: "/mapa", label: "Mapa" },
  szukaj: { href: "/szukaj", label: "Szukaj" },
  moje: { href: "/panel/moje", label: "Moje", tylkoZalogowany: true },
  czat: { href: "/panel/czat", label: "Czat", tylkoZalogowany: true },
  powiadomienia: { href: "/panel/powiadomienia", label: "Alerty", tylkoZalogowany: true },
  pomoc: { href: "/pomoc", label: "Pomoc", tylkoPubliczny: true },
  logowanie: { href: "/logowanie", label: "Login", tylkoPubliczny: true },
};

export type ZakladkaDolnejNawigacji = {
  href: string;
  label: string;
  klucz: KluczDolnejNawigacji;
};

/** Mapa zawsze na środku paska (wizualny hub aplikacji). */
export function uporzadkujDolnaNawDoWyswietlenia(tabs: ZakladkaDolnejNawigacji[]): ZakladkaDolnejNawigacji[] {
  if (tabs.length < 3) return tabs;
  const idx = tabs.findIndex((t) => t.klucz === "mapa");
  if (idx === -1) return tabs;
  const mapa = tabs[idx];
  const reszta = tabs.filter((t) => t.klucz !== "mapa");
  const srodek = Math.floor(tabs.length / 2);
  return [...reszta.slice(0, srodek), mapa, ...reszta.slice(srodek)];
}

export const DOMYSLNA_DOLNA_NAW_ZALOGOWANY: KluczDolnejNawigacji[] = [
  "mapa",
  "rynek",
  "szukaj",
  "moje",
  "panel",
];

export const DOMYSLNA_DOLNA_NAW_PUBLICZNY: KluczDolnejNawigacji[] = [
  "rynek",
  "szukaj",
  "pomoc",
  "logowanie",
];

export const KLUCZE_PANEL_NAWIGACJI = [
  "start",
  "mieszkaniec",
  "moje",
  "czat",
  "powiadomienia",
  "soltys",
  "profil",
  "admin",
] as const;

export type KluczPanelNawigacji = (typeof KLUCZE_PANEL_NAWIGACJI)[number];

export const ETYKIETY_PANEL_NAWIGACJI: Record<
  KluczPanelNawigacji,
  { href: string; label: string; ikona: string; wymagaSoltysa?: boolean; wymagaAdmina?: boolean }
> = {
  start: { href: "/panel", label: "Start", ikona: "🏠" },
  mieszkaniec: { href: "/panel/mieszkaniec", label: "Moja wieś", ikona: "🏡" },
  moje: { href: "/panel/moje", label: "Obserwowane", ikona: "★" },
  czat: { href: "/panel/czat", label: "Wiadomości", ikona: "💬" },
  powiadomienia: { href: "/panel/powiadomienia", label: "Powiadomienia", ikona: "🔔" },
  soltys: { href: "/panel/soltys", label: "Działania", ikona: "✅", wymagaSoltysa: true },
  profil: { href: "/panel/profil", label: "Ustawienia", ikona: "⚙️" },
  admin: { href: "/panel/admin", label: "Admin", ikona: "🛡️", wymagaAdmina: true },
};

export const DOMYSLNA_PANEL_NAW: KluczPanelNawigacji[] = [
  "start",
  "mieszkaniec",
  "moje",
  "czat",
  "powiadomienia",
  "profil",
];

const schemaPreferencjeUi = z.object({
  dolna_nawigacja: z.array(z.enum(KLUCZE_DOLNEJ_NAWIGACJI)).min(3).max(5).optional(),
  panel_nawigacja: z.array(z.enum(KLUCZE_PANEL_NAWIGACJI)).min(3).max(8).optional(),
});

export type PreferencjeUi = z.infer<typeof schemaPreferencjeUi>;

/** Domyślne preferencje UI zapisywane przy pierwszym onboardingu / rejestracji. */
export function domyslnePreferencjeUiNowegoUzytkownika(): PreferencjeUi {
  return { dolna_nawigacja: [...DOMYSLNA_DOLNA_NAW_ZALOGOWANY] };
}

export function parsujPreferencjeUiZMeta(meta: Record<string, unknown> | undefined): PreferencjeUi {
  const raw = meta?.ui_preferences;
  const w = schemaPreferencjeUi.safeParse(raw ?? {});
  if (!w.success) return {};
  return w.data;
}

export function pobierzKluczeDolnejNawigacjiZMeta(
  meta: Record<string, unknown> | undefined,
  zalogowany: boolean,
): KluczDolnejNawigacji[] {
  const prefs = parsujPreferencjeUiZMeta(meta);
  if (prefs.dolna_nawigacja?.length) {
    const filtrowane = prefs.dolna_nawigacja.filter((k) => {
      const d = ETYKIETY_DOLNEJ_NAWIGACJI[k];
      if (!d) return false;
      if (zalogowany && d.tylkoPubliczny) return false;
      if (!zalogowany && d.tylkoZalogowany) return false;
      return true;
    });
    if (filtrowane.length >= 3) return filtrowane.slice(0, 5);
  }
  return zalogowany ? [...DOMYSLNA_DOLNA_NAW_ZALOGOWANY] : [...DOMYSLNA_DOLNA_NAW_PUBLICZNY];
}

export function dolnaNawigacjaZKluczy(
  klucze: KluczDolnejNawigacji[] | undefined,
  zalogowany: boolean,
): ZakladkaDolnejNawigacji[] {
  const domysl = zalogowany ? DOMYSLNA_DOLNA_NAW_ZALOGOWANY : DOMYSLNA_DOLNA_NAW_PUBLICZNY;
  const wybrane = (klucze?.length ? klucze : domysl).slice(0, 5);

  const out: ZakladkaDolnejNawigacji[] = [];
  for (const k of wybrane) {
    const def = ETYKIETY_DOLNEJ_NAWIGACJI[k];
    if (!def) continue;
    if (zalogowany && def.tylkoPubliczny) continue;
    if (!zalogowany && def.tylkoZalogowany) continue;
    out.push({ href: def.href, label: def.label, klucz: k });
  }

  if (out.length < 3) {
    return uporzadkujDolnaNawDoWyswietlenia(dolnaNawigacjaZKluczy(undefined, zalogowany));
  }
  return uporzadkujDolnaNawDoWyswietlenia(out);
}

export function pobierzKluczePanelNawigacjiZMeta(
  meta: Record<string, unknown> | undefined,
  opcje: { pokazSoltysa: boolean; pokazAdmin: boolean },
): KluczPanelNawigacji[] {
  const prefs = parsujPreferencjeUiZMeta(meta);
  if (prefs.panel_nawigacja?.length) {
    const filtrowane = prefs.panel_nawigacja.filter((k) => {
      const d = ETYKIETY_PANEL_NAWIGACJI[k];
      if (!d) return false;
      if (d.wymagaSoltysa && !opcje.pokazSoltysa) return false;
      if (d.wymagaAdmina && !opcje.pokazAdmin) return false;
      return true;
    });
    if (filtrowane.length >= 3) return filtrowane.slice(0, 8);
  }
  let domysl = DOMYSLNA_PANEL_NAW.filter((k) => {
    const d = ETYKIETY_PANEL_NAWIGACJI[k];
    if (d.wymagaSoltysa && !opcje.pokazSoltysa) return false;
    if (d.wymagaAdmina && !opcje.pokazAdmin) return false;
    return true;
  });
  if (opcje.pokazSoltysa && !domysl.includes("soltys")) {
    const bezProfil = domysl.filter((k) => k !== "profil");
    domysl = [...bezProfil, "soltys", "profil"];
  }
  if (opcje.pokazAdmin && !domysl.includes("admin")) domysl = [...domysl, "admin"];
  return domysl.slice(0, 8);
}

export type ZakladkaPanelNawigacji = {
  href: string;
  label: string;
  klucz: KluczPanelNawigacji;
};

export function panelNawigacjaZKluczy(
  klucze: KluczPanelNawigacji[] | undefined,
  opcje: { pokazSoltysa: boolean; pokazAdmin: boolean },
): ZakladkaPanelNawigacji[] {
  const wybrane = (
    klucze?.length
      ? klucze
      : pobierzKluczePanelNawigacjiZMeta(undefined, opcje)
  ).slice(0, 8);

  const out: ZakladkaPanelNawigacji[] = [];
  for (const k of wybrane) {
    const def = ETYKIETY_PANEL_NAWIGACJI[k];
    if (!def) continue;
    if (def.wymagaSoltysa && !opcje.pokazSoltysa) continue;
    if (def.wymagaAdmina && !opcje.pokazAdmin) continue;
    out.push({ href: def.href, label: def.label, klucz: k });
  }
  if (out.length < 3) {
    return panelNawigacjaZKluczy(undefined, opcje);
  }
  return out;
}

/** localStorage — szybki odczyt po stronie klienta przed hydracją. */
export const KLUCZ_LS_PREFERENCJE_UI = "naszawies-ui-prefs-v1";

export function wczytajPreferencjeUiZLocalStorage(): PreferencjeUi | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KLUCZ_LS_PREFERENCJE_UI);
    if (!raw) return null;
    const w = schemaPreferencjeUi.safeParse(JSON.parse(raw));
    return w.success ? w.data : null;
  } catch {
    return null;
  }
}

export function zapiszPreferencjeUiDoLocalStorage(prefs: PreferencjeUi) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KLUCZ_LS_PREFERENCJE_UI, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}
