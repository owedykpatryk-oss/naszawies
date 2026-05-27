export const AKCJE_INWENTARZA = [
  "in_use",
  "to_repair",
  "to_remove",
  "wishlist",
  "wishlist_wow",
] as const;

export type AkcjaInwentarza = (typeof AKCJE_INWENTARZA)[number];

export const ETYKIETY_AKCJI_INWENTARZA: Record<
  AkcjaInwentarza,
  { label: string; opis: string; cls: string }
> = {
  in_use: {
    label: "Na sali — zostawiamy",
    opis: "Sprzęt w użyciu, bez zmian.",
    cls: "bg-emerald-50 text-emerald-900 border-emerald-200",
  },
  to_repair: {
    label: "Do naprawy",
    opis: "Wymaga serwisu lub drobnych napraw.",
    cls: "bg-amber-50 text-amber-950 border-amber-200",
  },
  to_remove: {
    label: "Do usunięcia",
    opis: "Zalecane wycofanie z użytku / utylizacja.",
    cls: "bg-red-50 text-red-900 border-red-200",
  },
  wishlist: {
    label: "Plan — do zakupu",
    opis: "Brakuje — warto dokupić.",
    cls: "bg-sky-50 text-sky-900 border-sky-200",
  },
  wishlist_wow: {
    label: "Plan WOW ✨",
    opis: "Pomysł z efektem „wow” dla wsi — projektor, nagłośnienie, smart tablica…",
    cls: "bg-violet-50 text-violet-950 border-violet-200 ring-1 ring-violet-300/50",
  },
};

export function normalizujAkcjeInwentarza(v: string | null | undefined): AkcjaInwentarza {
  if (v && (AKCJE_INWENTARZA as readonly string[]).includes(v)) {
    return v as AkcjaInwentarza;
  }
  return "in_use";
}
