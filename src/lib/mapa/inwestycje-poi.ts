/** Kategoria POI: planowane i trwające inwestycje na mapie wsi. */
export const KATEGORIA_INWESTYCJA = "inwestycja";

export const STATUSY_INWESTYCJI = ["planowana", "w_budowie", "zakonczona", "wstrzymana"] as const;

export type StatusInwestycji = (typeof STATUSY_INWESTYCJI)[number];

export const ETYKIETA_STATUSU_INWESTYCJI: Record<StatusInwestycji, string> = {
  planowana: "Planowana",
  w_budowie: "W budowie",
  zakonczona: "Zakończona",
  wstrzymana: "Wstrzymana",
};

export const KOLOR_STATUSU_INWESTYCJI: Record<StatusInwestycji, string> = {
  planowana: "#d97706",
  w_budowie: "#ea580c",
  zakonczona: "#16a34a",
  wstrzymana: "#78716c",
};

export function czyKategoriaInwestycji(kategoria: string): boolean {
  return kategoria.trim().toLowerCase() === KATEGORIA_INWESTYCJA;
}

export function normalizujStatusInwestycji(
  wartosc: string | null | undefined,
): StatusInwestycji | null {
  const k = wartosc?.trim().toLowerCase();
  if (!k) return null;
  return (STATUSY_INWESTYCJI as readonly string[]).includes(k) ? (k as StatusInwestycji) : null;
}

export function etykietaStatusuInwestycji(status: string | null | undefined): string | null {
  const s = normalizujStatusInwestycji(status);
  return s ? ETYKIETA_STATUSU_INWESTYCJI[s] : null;
}

export function formatujTerminInwestycji(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = iso.trim().slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return null;
  return `${day}.${m}.${y}`;
}

export function bezpiecznyUrlDokumentu(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (u.startsWith("https://") || u.startsWith("http://")) return u;
  return null;
}
