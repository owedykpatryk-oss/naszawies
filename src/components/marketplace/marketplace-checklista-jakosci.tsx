"use client";

import {
  etykietaPoziomuJakosci,
  obliczJakoscOgloszenia,
  szablonOpisuKategorii,
  type DaneJakosciOgloszenia,
} from "@/lib/marketplace/jakosc-ogloszenia";

const KOLORY_POZIOMU = {
  slaba: "from-red-50 to-stone-50 border-red-200/70 text-red-950",
  srednia: "from-amber-50 to-orange-50/50 border-amber-200/70 text-amber-950",
  dobra: "from-emerald-50 to-green-50/50 border-emerald-200/70 text-emerald-950",
  kompletna: "from-green-50 to-emerald-50 border-green-300/70 text-green-950",
};

const KOLORY_PASKA = {
  slaba: "bg-red-500",
  srednia: "bg-amber-500",
  dobra: "bg-emerald-500",
  kompletna: "bg-green-600",
};

type Props = DaneJakosciOgloszenia & {
  zOperatorem?: boolean;
  onUzupelnijOpis?: (tekst: string) => void;
};

export function MarketplaceChecklistaJakosci({
  onUzupelnijOpis,
  zOperatorem = false,
  ...dane
}: Props) {
  const wynik = obliczJakoscOgloszenia({ ...dane, zOperatorem });
  const kolory = KOLORY_POZIOMU[wynik.poziom];
  const pasek = KOLORY_PASKA[wynik.poziom];
  const brakujace = wynik.pozycje.filter((p) => !p.spełnione && p.wazne);
  const opcjonalne = wynik.pozycje.filter((p) => !p.spełnione && !p.wazne);

  return (
    <aside
      className={`sticky top-20 rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${kolory}`}
      aria-label="Checklista jakości ogłoszenia"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Jakość ogłoszenia</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{wynik.procent}%</p>
          <p className="text-xs font-semibold">{etykietaPoziomuJakosci(wynik.poziom)}</p>
        </div>
        <span className="text-2xl" aria-hidden>
          {wynik.poziom === "kompletna" ? "⭐" : wynik.poziom === "dobra" ? "✨" : "📋"}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pasek}`}
          style={{ width: `${wynik.procent}%` }}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed opacity-90">
        Im wyższy wynik, tym wyżej w sortowaniu <strong>„Polecane”</strong> i więcej zapytań. Sołtys szybciej
        zatwierdza kompletne ogłoszenia.
      </p>

      {brakujace.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">Do zrobienia</p>
          <ul className="mt-2 space-y-2">
            {brakujace.map((p) => (
              <li key={p.id} className="rounded-lg bg-white/70 px-2.5 py-2 text-xs">
                <p className="font-semibold">{p.label}</p>
                <p className="mt-0.5 leading-snug opacity-80">{p.wskazowka}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {opcjonalne.length > 0 && brakujace.length < 3 ? (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">Opcjonalnie (+punkty)</p>
          <ul className="mt-1.5 space-y-1 text-xs opacity-90">
            {opcjonalne.slice(0, 4).map((p) => (
              <li key={p.id} className="flex gap-1.5">
                <span aria-hidden className="text-stone-400">
                  ○
                </span>
                {p.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg bg-white/60 px-2.5 py-2 text-xs">
        <p className="font-semibold">Słowa kluczowe w tej kategorii</p>
        <p className="mt-1 flex flex-wrap gap-1">
          {wynik.slowaKluczowe.map((s) => (
            <span key={s} className="rounded-full bg-white/90 px-2 py-0.5 font-medium shadow-sm">
              {s}
            </span>
          ))}
        </p>
      </div>

      {onUzupelnijOpis && dane.opis.trim().length < 40 ? (
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-green-800/30 bg-white/90 px-3 py-2 text-xs font-semibold text-green-900 shadow-sm hover:bg-white"
          onClick={() => onUzupelnijOpis(szablonOpisuKategorii(dane.kategoria, zOperatorem))}
        >
          Wstaw szablon opisu dla kategorii
        </button>
      ) : null}
    </aside>
  );
}
