import type { StatystykiKataloguWsi } from "@/lib/landing/statystyki-katalogu-wsi";

const PL_LACZ = "__LANDING_STAT_WSIE_LACZNIE__";
const PL_AKT = "__LANDING_STAT_WSIE_AKTYWNE__";

/**
 * Zastępuje placeholdery w `landing-body.html` (po `npm run sync-landing` zachowaj te ciągi w pliku).
 */
export function wstrzyknijStatystykiWHtmlLandingu(
  html: string,
  stats: StatystykiKataloguWsi | null,
): string {
  const lacz = stats != null ? String(stats.wsieLacznie) : "—";
  const akt = stats != null ? String(stats.wsieZAktywnymProfilem) : "—";
  return html.replaceAll(PL_LACZ, lacz).replaceAll(PL_AKT, akt);
}
