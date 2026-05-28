"use client";

type Props = {
  rezerwacjeOczekujace: number;
  rezerwacjeZatwierdzone: number;
  rezerwacjeOdrzucone: number;
  sredniaGosci: number | null;
  popularnyPreset: string | null;
};

const ETYKIETY_PRESET: Record<string, string> = {
  auto_bankiet: "Auto bankiet",
  teatralny: "Teatralny",
  warsztatowy: "Warsztatowy",
  u_ksztalt: "U-kształt",
  wlasny: "Własny",
};

export function StatystykiSwietlicyKlient({
  rezerwacjeOczekujace,
  rezerwacjeZatwierdzone,
  rezerwacjeOdrzucone,
  sredniaGosci,
  popularnyPreset,
}: Props) {
  const razem = rezerwacjeOczekujace + rezerwacjeZatwierdzone + rezerwacjeOdrzucone;
  return (
    <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">Statystyki sali</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-amber-50 px-3 py-2">
          <p className="text-2xl font-bold text-amber-900">{rezerwacjeOczekujace}</p>
          <p className="text-xs text-amber-800">Oczekujące</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2">
          <p className="text-2xl font-bold text-emerald-900">{rezerwacjeZatwierdzone}</p>
          <p className="text-xs text-emerald-800">Zatwierdzone</p>
        </div>
        <div className="rounded-xl bg-stone-50 px-3 py-2">
          <p className="text-2xl font-bold text-stone-800">{rezerwacjeOdrzucone}</p>
          <p className="text-xs text-stone-600">Odrzucone</p>
        </div>
        <div className="rounded-xl bg-sky-50 px-3 py-2">
          <p className="text-2xl font-bold text-sky-900">{sredniaGosci ?? "—"}</p>
          <p className="text-xs text-sky-800">Śr. gości</p>
        </div>
      </div>
      {razem > 0 ? (
        <p className="mt-3 text-xs text-stone-600">
          Wszystkich wniosków: {razem}
          {popularnyPreset ? (
            <> · Popularny układ: <strong>{ETYKIETY_PRESET[popularnyPreset] ?? popularnyPreset}</strong></>
          ) : null}
        </p>
      ) : (
        <p className="mt-3 text-xs text-stone-500">Brak rezerwacji — statystyki pojawią się po pierwszym wniosku.</p>
      )}
    </section>
  );
}
