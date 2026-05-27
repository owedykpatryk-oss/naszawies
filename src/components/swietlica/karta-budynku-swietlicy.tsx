type Props = {
  nazwa: string;
  adres?: string | null;
  areaM2?: number | null;
  maxCapacity?: number | null;
  parkingSpaces?: number | null;
  opis?: string | null;
  /** Kompaktowy wariant na liście sal */
  wariant?: "pelny" | "kompakt";
};

function formatPowierzchnia(v: number | null | undefined): string | null {
  if (v == null || !Number.isFinite(Number(v))) return null;
  const n = Number(v);
  return n % 1 === 0 ? `${n} m²` : `${n.toFixed(1)} m²`;
}

export function KartaBudynkuSwietlicy({
  nazwa,
  adres,
  areaM2,
  maxCapacity,
  parkingSpaces,
  opis,
  wariant = "pelny",
}: Props) {
  const pow = formatPowierzchnia(areaM2);

  if (wariant === "kompakt") {
    const czesci = [
      maxCapacity ? `do ${maxCapacity} os.` : null,
      pow,
      parkingSpaces != null ? `${parkingSpaces} miejsc parkingowych` : null,
      adres,
    ].filter(Boolean);
    return (
      <p className="text-sm text-stone-600">
        <strong className="text-stone-900">{nazwa}</strong>
        {czesci.length ? ` · ${czesci.join(" · ")}` : null}
      </p>
    );
  }

  return (
    <section
      id="budynek-swietlicy"
      className="scroll-mt-24 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-stone-50/80 p-5 shadow-sm sm:p-6"
    >
      <h2 className="font-serif text-xl text-green-950">Budynek świetlicy</h2>
      <p className="mt-1 text-xs text-stone-500">{nazwa}</p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Adres</dt>
          <dd className="mt-1 text-sm font-medium text-stone-900">{adres?.trim() || "— uzupełni sołtys"}</dd>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Pojemność sali</dt>
          <dd className="mt-1 text-sm font-medium text-stone-900">
            {maxCapacity ? `${maxCapacity} osób` : "—"}
          </dd>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Powierzchnia</dt>
          <dd className="mt-1 text-sm font-medium text-stone-900">{pow ?? "—"}</dd>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Parking</dt>
          <dd className="mt-1 text-sm font-medium text-stone-900">
            {parkingSpaces != null ? `${parkingSpaces} miejsc` : "—"}
          </dd>
        </div>
      </dl>

      {opis?.trim() ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700">{opis.trim()}</p>
      ) : null}
    </section>
  );
}
