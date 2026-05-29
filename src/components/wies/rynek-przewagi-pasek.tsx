/** Pasek przewag rynku lokalnego vs OLX/Otodom — buduje zaufanie i ruch. */
export function RynekPrzewagiPasek({ kompakt = false }: { kompakt?: boolean }) {
  const przewagi = [
    { emoji: "✓", label: "Zatwierdzone przez sołtysa", kolor: "emerald" as const },
    { emoji: "📐", label: "Działki z mapą Geoportalu", kolor: "amber" as const },
    { emoji: "💬", label: "Czat między sąsiadami", kolor: "sky" as const },
    { emoji: "🆓", label: "0 zł — bez prowizji", kolor: "orange" as const },
    { emoji: "🤝", label: "Bez płatności online — dogadujecie się sami", kolor: "stone" as const },
  ];

  const kolory = {
    emerald: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
    amber: "border-amber-200/80 bg-amber-50/90 text-amber-950",
    sky: "border-sky-200/80 bg-sky-50/90 text-sky-950",
    orange: "border-orange-200/80 bg-orange-50/90 text-orange-950",
    stone: "border-stone-200/80 bg-stone-50/90 text-stone-800",
  };

  return (
    <div
      className={`flex flex-wrap gap-2 ${kompakt ? "mt-3" : "mt-4"}`}
      role="list"
      aria-label="Dlaczego rynek lokalny naszawies.pl"
    >
      {przewagi.map((p) => (
        <span
          key={p.label}
          role="listitem"
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm sm:text-xs ${kolory[p.kolor]}`}
        >
          <span aria-hidden>{p.emoji}</span>
          {p.label}
        </span>
      ))}
    </div>
  );
}
