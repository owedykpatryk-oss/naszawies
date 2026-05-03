import Link from "next/link";

export type TransportOdjazdPubliczny = {
  id: string;
  station_name: string | null;
  train_label: string;
  destination: string | null;
  platform: string | null;
  planned_at: string;
  realtime_at: string | null;
  delay_min: number | null;
  is_cancelled: boolean;
  status: string | null;
  fetched_at: string;
};

function colorClass(status: string): string {
  if (status === "red") return "bg-rose-100 text-rose-900 border-rose-300";
  if (status === "orange") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-emerald-100 text-emerald-900 border-emerald-300";
}

export function WiesTransportWidget({
  sciezkaWsi,
  status,
  odjazdy,
  delayAlertMin = 15,
  walkingMarginMin = 8,
}: {
  sciezkaWsi: string;
  status: {
    status_color: string;
    status_label: string;
    delayed_count: number;
    cancelled_count: number;
    fallback_mode: boolean;
    updated_at: string;
  } | null;
  odjazdy: TransportOdjazdPubliczny[];
  delayAlertMin?: number;
  walkingMarginMin?: number;
}) {
  const frazaStacji = encodeURIComponent(odjazdy[0]?.station_name ?? "");
  const linkRozklad = frazaStacji
    ? `/transport/rozklad?stacja=${frazaStacji}`
    : `${sciezkaWsi}`;

  if (!status && odjazdy.length === 0) return null;

  const teraz = Date.now();
  const najblizszy = odjazdy.find((o) => Date.parse(o.realtime_at ?? o.planned_at) > teraz);
  const minDoNajblizszego = najblizszy
    ? Math.max(0, Math.round((Date.parse(najblizszy.realtime_at ?? najblizszy.planned_at) - teraz) / 60000))
    : null;
  const wyjscieZa = minDoNajblizszego != null ? Math.max(0, minDoNajblizszego - walkingMarginMin) : null;
  const poranne = odjazdy
    .filter((o) => {
      const h = new Date(o.planned_at).getHours();
      return h >= 5 && h < 11;
    })
    .slice(0, 2);
  const wieczorne = odjazdy
    .filter((o) => {
      const h = new Date(o.planned_at).getHours();
      return h >= 16 && h <= 23;
    })
    .slice(-2);

  return (
    <section className="mt-10 rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-green-950">Najbliższe odjazdy</h2>
        {status ? (
          <span className={`rounded-full border px-2 py-1 text-xs ${colorClass(status.status_color)}`}>
            Linia: {status.status_label}
          </span>
        ) : null}
      </div>

      {status?.fallback_mode ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Live chwilowo niedostępne — pokazujemy planowy rozkład z ostatniej synchronizacji.
        </p>
      ) : null}

      {wyjscieZa != null ? (
        <p className="mt-3 text-sm text-stone-700">
          <strong>Czy zdążę?</strong> Wyjście za około <strong>{wyjscieZa} min</strong> (margines {walkingMarginMin} min).
        </p>
      ) : (
        <p className="mt-3 text-sm text-stone-600">Brak nadchodzących kursów do obliczenia trybu „czy zdążę?”.</p>
      )}

      {odjazdy.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {odjazdy.slice(0, 8).map((d) => {
            const realtime = d.realtime_at ? new Date(d.realtime_at) : null;
            const planned = new Date(d.planned_at);
            const mocneOpoznienie = (d.delay_min ?? 0) >= delayAlertMin;
            return (
              <li key={d.id} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-stone-900">
                    {d.train_label}
                    {d.destination ? ` → ${d.destination}` : ""}
                  </p>
                  <p className="text-xs text-stone-500">{d.station_name ?? "Stacja"}</p>
                </div>
                <p className="mt-1 text-sm text-stone-700">
                  {planned.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                  {realtime ? ` → ${realtime.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  {d.platform ? ` · peron ${d.platform}` : ""}
                </p>
                <p className="mt-1 text-xs">
                  {d.is_cancelled ? (
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-900">Odwołany</span>
                  ) : mocneOpoznienie ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">Opóźnienie {d.delay_min} min</span>
                  ) : d.delay_min != null && d.delay_min > 0 ? (
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-stone-700">+{d.delay_min} min</span>
                  ) : (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">Planowo</span>
                  )}
                  {d.status ? <span className="ml-2 text-stone-500">{d.status}</span> : null}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-stone-600">Brak odjazdów w cache dla tej wsi.</p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-stone-500">Rano do pracy/szkoły</p>
          {poranne.length === 0 ? (
            <p className="mt-1 text-xs text-stone-600">Brak kursów porannych.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-xs text-stone-700">
              {poranne.map((d) => (
                <li key={`morning-${d.id}`}>
                  {new Date(d.planned_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                  {d.delay_min ? ` (+${d.delay_min} min)` : ""}
                  {d.destination ? ` → ${d.destination}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-stone-500">Powrót wieczorem</p>
          {wieczorne.length === 0 ? (
            <p className="mt-1 text-xs text-stone-600">Brak kursów wieczornych.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-xs text-stone-700">
              {wieczorne.map((d) => (
                <li key={`evening-${d.id}`}>
                  {new Date(d.planned_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                  {d.delay_min ? ` (+${d.delay_min} min)` : ""}
                  {d.destination ? ` → ${d.destination}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <Link href={linkRozklad} className="text-green-800 underline">
          Pełny rozkład transportu
        </Link>
        <Link href="/panel/powiadomienia" className="text-green-800 underline">
          Powiadom mnie o zmianach
        </Link>
      </div>
    </section>
  );
}
