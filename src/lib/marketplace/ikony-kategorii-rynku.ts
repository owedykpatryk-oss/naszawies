export type IkonaKategoriiRynek = {
  emoji: string;
  /** Tailwind gradient classes (from-via-to) */
  gradient: string;
};

const DOMYSLNA: IkonaKategoriiRynek = {
  emoji: "🏷️",
  gradient: "from-orange-100 via-amber-50 to-stone-100",
};

const MAPA: Record<string, IkonaKategoriiRynek> = {
  miod: { emoji: "🍯", gradient: "from-amber-300/80 via-yellow-100 to-orange-50" },
  sery_nabial: { emoji: "🧀", gradient: "from-yellow-200/70 via-amber-50 to-white" },
  mieso_wedliny: { emoji: "🥩", gradient: "from-rose-200/60 via-orange-50 to-stone-50" },
  warzywa_owoce: { emoji: "🥕", gradient: "from-orange-200/70 via-lime-50 to-emerald-50" },
  pieczywo: { emoji: "🍞", gradient: "from-amber-200/60 via-orange-50 to-stone-50" },
  przetwory: { emoji: "🫙", gradient: "from-red-200/50 via-rose-50 to-amber-50" },
  ziarno_maka: { emoji: "🌾", gradient: "from-yellow-300/60 via-amber-100 to-stone-50" },
  napoje_lokalne: { emoji: "🧃", gradient: "from-lime-200/60 via-green-50 to-emerald-50" },
  inne_jedzenie: { emoji: "🧺", gradient: "from-emerald-200/50 via-lime-50 to-white" },
  ciagnik: { emoji: "🚜", gradient: "from-lime-300/70 via-green-100 to-emerald-50" },
  kombajn: { emoji: "🌽", gradient: "from-yellow-300/70 via-amber-100 to-lime-50" },
  maszyna_rolnicza: { emoji: "⚙️", gradient: "from-stone-300/60 via-slate-100 to-stone-50" },
  pojazd: { emoji: "🚛", gradient: "from-sky-200/60 via-blue-50 to-stone-50" },
  narzedzia: { emoji: "🔧", gradient: "from-zinc-300/60 via-stone-100 to-stone-50" },
  konie: { emoji: "🐴", gradient: "from-amber-200/60 via-orange-50 to-stone-50" },
  dzialka_budowlana: { emoji: "📐", gradient: "from-amber-300/70 via-yellow-100 to-lime-50" },
  dzialka_rolna: { emoji: "🌱", gradient: "from-green-300/60 via-lime-100 to-emerald-50" },
  dzialka_rekreacyjna: { emoji: "🌲", gradient: "from-emerald-300/60 via-green-100 to-teal-50" },
  dom_mieszkalny: { emoji: "🏠", gradient: "from-sky-200/60 via-blue-50 to-stone-50" },
  budynek_gospodarczy: { emoji: "🏚️", gradient: "from-stone-300/60 via-amber-50 to-stone-50" },
  grunt_dzierzawa: { emoji: "📋", gradient: "from-lime-200/60 via-green-50 to-stone-50" },
  usluga_z_operatorem: { emoji: "👷", gradient: "from-sky-200/70 via-cyan-50 to-blue-50" },
  inne: { emoji: "📦", gradient: "from-stone-200/70 via-stone-50 to-white" },
};

export function ikonaKategoriiRynek(kategoria: string | null | undefined): IkonaKategoriiRynek {
  if (!kategoria) return DOMYSLNA;
  return MAPA[kategoria] ?? DOMYSLNA;
}
