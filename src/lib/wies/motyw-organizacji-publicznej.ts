import type { SegmentOrganizacji } from "@/lib/wies/sciezka-organizacji-publicznej";

export type MotywOrganizacji = {
  segment: SegmentOrganizacji;
  etykietaTypu: string;
  ikona: string;
  heroGradient: string;
  heroBorder: string;
  heroText: string;
  heroSubtext: string;
  pill: string;
  tabAktywna: string;
  tabNieaktywna: string;
  przyciskPrimary: string;
  przyciskSecondary: string;
  cardBorder: string;
};

const MOTYWY: Record<SegmentOrganizacji, Omit<MotywOrganizacji, "segment">> = {
  kgw: {
    etykietaTypu: "Koło Gospodyń Wiejskich",
    ikona: "🌸",
    heroGradient: "from-rose-100/90 via-white to-fuchsia-50/80",
    heroBorder: "border-rose-300/50",
    heroText: "text-rose-950",
    heroSubtext: "text-rose-800/80",
    pill: "bg-rose-100/90 text-rose-950 border-rose-300/60",
    tabAktywna: "border-rose-600 bg-rose-50 text-rose-950",
    tabNieaktywna: "border-stone-200 text-stone-600 hover:border-rose-200 hover:bg-rose-50/50",
    przyciskPrimary: "bg-rose-800 hover:bg-rose-900 text-white",
    przyciskSecondary: "border-rose-300 bg-white text-rose-900 hover:bg-rose-50",
    cardBorder: "border-rose-200/80",
  },
  parafia: {
    etykietaTypu: "Parafia / duszpasterstwo",
    ikona: "⛪",
    heroGradient: "from-violet-100/90 via-white to-indigo-50/70",
    heroBorder: "border-violet-300/50",
    heroText: "text-violet-950",
    heroSubtext: "text-violet-800/80",
    pill: "bg-violet-100/90 text-violet-950 border-violet-300/60",
    tabAktywna: "border-violet-600 bg-violet-50 text-violet-950",
    tabNieaktywna: "border-stone-200 text-stone-600 hover:border-violet-200 hover:bg-violet-50/50",
    przyciskPrimary: "bg-violet-900 hover:bg-violet-950 text-white",
    przyciskSecondary: "border-violet-300 bg-white text-violet-900 hover:bg-violet-50",
    cardBorder: "border-violet-200/80",
  },
  lowiectwo: {
    etykietaTypu: "Koło łowieckie",
    ikona: "🦌",
    heroGradient: "from-amber-100/90 via-white to-emerald-50/70",
    heroBorder: "border-amber-400/50",
    heroText: "text-emerald-950",
    heroSubtext: "text-amber-900/80",
    pill: "bg-amber-100/90 text-amber-950 border-amber-400/60",
    tabAktywna: "border-amber-700 bg-amber-50 text-amber-950",
    tabNieaktywna: "border-stone-200 text-stone-600 hover:border-amber-200 hover:bg-amber-50/50",
    przyciskPrimary: "bg-emerald-900 hover:bg-emerald-950 text-white",
    przyciskSecondary: "border-amber-400 bg-white text-emerald-950 hover:bg-amber-50",
    cardBorder: "border-emerald-200/80",
  },
  osp: {
    etykietaTypu: "OSP / straż pożarna",
    ikona: "🚒",
    heroGradient: "from-red-100/90 via-white to-orange-50/70",
    heroBorder: "border-red-300/50",
    heroText: "text-red-950",
    heroSubtext: "text-red-800/80",
    pill: "bg-red-100/90 text-red-950 border-red-300/60",
    tabAktywna: "border-red-600 bg-red-50 text-red-950",
    tabNieaktywna: "border-stone-200 text-stone-600 hover:border-red-200 hover:bg-red-50/50",
    przyciskPrimary: "bg-red-800 hover:bg-red-900 text-white",
    przyciskSecondary: "border-red-300 bg-white text-red-900 hover:bg-red-50",
    cardBorder: "border-red-200/80",
  },
  sport: {
    etykietaTypu: "Klub sportowy",
    ikona: "⚽",
    heroGradient: "from-sky-100/90 via-white to-teal-50/70",
    heroBorder: "border-sky-300/50",
    heroText: "text-sky-950",
    heroSubtext: "text-sky-800/80",
    pill: "bg-sky-100/90 text-sky-950 border-sky-300/60",
    tabAktywna: "border-sky-600 bg-sky-50 text-sky-950",
    tabNieaktywna: "border-stone-200 text-stone-600 hover:border-sky-200 hover:bg-sky-50/50",
    przyciskPrimary: "bg-sky-800 hover:bg-sky-900 text-white",
    przyciskSecondary: "border-sky-300 bg-white text-sky-900 hover:bg-sky-50",
    cardBorder: "border-sky-200/80",
  },
  szkola: {
    etykietaTypu: "Szkoła / przedszkole",
    ikona: "🏫",
    heroGradient: "from-sky-100/90 via-white to-cyan-50/70",
    heroBorder: "border-sky-300/50",
    heroText: "text-sky-950",
    heroSubtext: "text-sky-800/80",
    pill: "bg-sky-100/90 text-sky-950 border-sky-300/60",
    tabAktywna: "border-sky-600 bg-sky-50 text-sky-950",
    tabNieaktywna: "border-stone-200 text-stone-600 hover:border-sky-200 hover:bg-sky-50/50",
    przyciskPrimary: "bg-sky-800 hover:bg-sky-900 text-white",
    przyciskSecondary: "border-sky-300 bg-white text-sky-900 hover:bg-sky-50",
    cardBorder: "border-sky-200/80",
  },
  rolnicy: {
    etykietaTypu: "Koło rolników",
    ikona: "🌾",
    heroGradient: "from-lime-100/90 via-white to-green-50/70",
    heroBorder: "border-lime-300/50",
    heroText: "text-lime-950",
    heroSubtext: "text-lime-800/80",
    pill: "bg-lime-100/90 text-lime-950 border-lime-300/60",
    tabAktywna: "border-lime-700 bg-lime-50 text-lime-950",
    tabNieaktywna: "border-stone-200 text-stone-600 hover:border-lime-200 hover:bg-lime-50/50",
    przyciskPrimary: "bg-lime-800 hover:bg-lime-900 text-white",
    przyciskSecondary: "border-lime-300 bg-white text-lime-900 hover:bg-lime-50",
    cardBorder: "border-lime-200/80",
  },
};

export function motywOrganizacji(segment: SegmentOrganizacji): MotywOrganizacji {
  return { segment, ...MOTYWY[segment] };
}
