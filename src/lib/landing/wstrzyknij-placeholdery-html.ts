import type { StatystykiKataloguWsi } from "@/lib/landing/statystyki-katalogu-wsi";

const PL_LACZ = "__LANDING_STAT_WSIE_LACZNIE__";
const PL_AKT = "__LANDING_STAT_WSIE_AKTYWNE__";
const PL_OGL = "__LANDING_STAT_OGLOSZENIA_RYNKU__";
const PL_FIRM = "__LANDING_STAT_FIRMY_RYNKU__";

function metaAnim(value: string): string {
  if (!/^\d+$/.test(value)) return value;
  return `<span class="meta-value meta-value--anim" data-count="${value}">0</span>`;
}

/**
 * Zastępuje placeholdery w `landing-body.html` (po `npm run sync-landing` zachowaj te ciągi w pliku).
 */
export function wstrzyknijStatystykiWHtmlLandingu(
  html: string,
  stats: StatystykiKataloguWsi | null,
): string {
  const lacz = stats != null ? String(stats.wsieLacznie) : "—";
  const akt = stats != null ? String(stats.wsieZAktywnymProfilem) : "—";
  const ogl = stats != null ? String(stats.ogloszeniaRynek) : "—";
  const firm = stats != null ? String(stats.profileFirmRynek) : "—";

  return html
    .replaceAll(PL_LACZ, metaAnim(lacz))
    .replaceAll(PL_AKT, metaAnim(akt))
    .replaceAll(PL_OGL, metaAnim(ogl))
    .replaceAll(PL_FIRM, metaAnim(firm));
}
