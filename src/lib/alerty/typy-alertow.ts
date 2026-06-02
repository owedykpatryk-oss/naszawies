/** Etykiety i kolory alertów awarii wsi. */

export type RodzajAlertu = "prad" | "woda" | "droga" | "gaz" | "inne";

export type AlertWsi = {
  id: string;
  kind: RodzajAlertu;
  title: string;
  body: string | null;
  status: "active" | "resolved";
  expected_end_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

export const ETYKIETY_ALERTU: Record<RodzajAlertu, string> = {
  prad: "Awaria prądu",
  woda: "Awaria wody",
  droga: "Droga / dojazd",
  gaz: "Gaz / CO",
  inne: "Inne",
};

export const IKONY_ALERTU: Record<RodzajAlertu, string> = {
  prad: "⚡",
  woda: "💧",
  droga: "🚧",
  gaz: "🔥",
  inne: "⚠️",
};

export function formatujDateAlertu(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}
