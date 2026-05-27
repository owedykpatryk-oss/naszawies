import type { KategoriaLinkuPrzydatnego } from "@/lib/wies/linki-przydatne";

const STYL: Record<
  KategoriaLinkuPrzydatnego,
  { litera: string; klasy: string }
> = {
  bip_gmina: { litera: "B", klasy: "bg-emerald-100 text-emerald-900 ring-emerald-200/80" },
  urzad_gmina: { litera: "U", klasy: "bg-emerald-100 text-emerald-900 ring-emerald-200/80" },
  urzad_powiat: { litera: "P", klasy: "bg-teal-100 text-teal-900 ring-teal-200/80" },
  gazeta: { litera: "G", klasy: "bg-sky-100 text-sky-900 ring-sky-200/80" },
  radio: { litera: "R", klasy: "bg-sky-100 text-sky-900 ring-sky-200/80" },
  portal: { litera: "W", klasy: "bg-indigo-100 text-indigo-900 ring-indigo-200/80" },
  tv: { litera: "TV", klasy: "bg-violet-100 text-violet-900 ring-violet-200/80" },
  social: { litera: "@", klasy: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200/80" },
  pomoc_spoleczna: { litera: "!", klasy: "bg-amber-100 text-amber-950 ring-amber-200/80" },
  zdrowie: { litera: "+", klasy: "bg-rose-100 text-rose-900 ring-rose-200/80" },
  edukacja: { litera: "E", klasy: "bg-lime-100 text-lime-900 ring-lime-200/80" },
  inne: { litera: "·", klasy: "bg-stone-100 text-stone-800 ring-stone-200/80" },
};

const GRUPA_RAMKA: Record<string, string> = {
  urzad: "border-l-emerald-500",
  media: "border-l-sky-500",
  pomoc: "border-l-amber-500",
  inne: "border-l-stone-400",
};

export function IkonaKategoriiLinku({ category }: { category: KategoriaLinkuPrzydatnego }) {
  const s = STYL[category];
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1 ${s.klasy}`}
      aria-hidden
    >
      {s.litera}
    </span>
  );
}

export function klasaRamkiGrupyLinkow(grupa: "urzad" | "media" | "pomoc" | "inne"): string {
  return GRUPA_RAMKA[grupa] ?? GRUPA_RAMKA.inne;
}
