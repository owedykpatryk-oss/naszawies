import Link from "next/link";
import { RozkladSzukajFormularz } from "@/components/transport/rozklad-szukaj-formularz";
import { pobierzOdjazdyDlaStacjiPkp, wyszukajStacjePkpPoNazwie } from "@/lib/transport/pkp-plk-api";

type Props = {
  searchParams?: { stacja?: string | string[] };
};

function pojedynczy(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export const metadata = {
  title: "Rozkład stacji PKP",
  robots: { index: true, follow: true },
};

export default async function RozkladStacjiPage({ searchParams }: Props) {
  const stacjaFraza = pojedynczy(searchParams?.stacja).trim();

  let msg: string | null = null;
  let stacje: { id: string; name: string }[] = [];
  let odjazdy: Awaited<ReturnType<typeof pobierzOdjazdyDlaStacjiPkp>> = [];
  let wybrana: { id: string; name: string } | null = null;

  if (stacjaFraza) {
    try {
      stacje = await wyszukajStacjePkpPoNazwie(stacjaFraza);
      if (stacje.length === 0) {
        msg = "Nie znaleziono stacji w danych PKP dla tej frazy.";
      } else {
        wybrana = stacje[0];
        odjazdy = await pobierzOdjazdyDlaStacjiPkp(wybrana.id);
        if (odjazdy.length === 0) {
          msg = "Brak nadchodzących odjazdów dla wybranej stacji.";
        }
      }
    } catch (e) {
      msg = e instanceof Error ? e.message : "Błąd pobierania rozkładu.";
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-stone-800">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/transport" className="text-green-800 underline">
          ← Transport
        </Link>
        {" · "}
        <Link href="/szukaj" className="text-green-800 underline">
          Szukaj wsi
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Rozkład stacji kolejowej (PKP)</h1>
      <p className="mt-2 text-sm text-stone-600">
        Dane z PKP PLK OpenData API, gdy na serwerze ustawiono <code className="text-xs">PKP_PLK_API_KEY</code>.
      </p>

      <RozkladSzukajFormularz domyslnaStacja={stacjaFraza} />

      {stacje.length > 1 ? (
        <div className="mt-5 rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Wybierz stację</p>
          <ul className="mt-2 space-y-2">
            {stacje.slice(0, 8).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/transport/rozklad?stacja=${encodeURIComponent(s.name)}`}
                  className="text-sm font-medium text-green-800 underline"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {wybrana ? (
        <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-900">Wybrana stacja</p>
          <p className="mt-1 font-medium text-emerald-950">{wybrana.name}</p>
        </section>
      ) : null}

      {odjazdy.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-green-950">Najbliższe odjazdy</h2>
          <ul className="mt-3 space-y-2">
            {odjazdy.map((d, i) => (
              <li key={`${d.whenIso}-${i}`} className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-medium text-stone-900">
                  {d.trainLabel}
                  {d.destination ? ` → ${d.destination}` : ""}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {new Date(d.plannedWhenIso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                  {d.realtimeWhenIso
                    ? ` → ${new Date(d.realtimeWhenIso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`
                    : ""}
                  {d.platform ? ` · peron ${d.platform}` : ""}
                  {d.carrier ? ` · ${d.carrier}` : ""}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {d.isCancelled
                    ? "Odwołany"
                    : d.delayMinutes != null && d.delayMinutes > 0
                      ? `Opóźnienie ${d.delayMinutes} min`
                      : "Planowo"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {msg ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{msg}</p>
      ) : null}

      <p className="mt-6 text-xs text-stone-500">
        Autobusy i PKS:{" "}
        <a className="text-green-800 underline" href="https://www.e-podroznik.pl" target="_blank" rel="noreferrer">
          e-podroznik.pl
        </a>
        {" · "}
        <Link href="/transport" className="text-green-800 underline">
          więcej o transporcie
        </Link>
      </p>
    </main>
  );
}
