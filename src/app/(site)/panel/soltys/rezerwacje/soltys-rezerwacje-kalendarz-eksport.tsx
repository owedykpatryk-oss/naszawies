"use client";

import { useCallback, useMemo, useState } from "react";

export type WierszKalendarza = {
  id: string;
  hall_id: string;
  sala_nazwa: string;
  status: "pending" | "approved";
  start_at: string;
  end_at: string;
  event_type: string;
  event_title: string | null;
  contact_phone: string | null;
  mieszkaniec: string;
};

export type WierszEksportu = {
  id: string;
  hall_id: string;
  sala_nazwa: string;
  status: string;
  start_at: string;
  end_at: string;
  event_type: string;
  event_title: string | null;
  expected_guests: number;
  contact_phone: string | null;
  created_at: string;
  mieszkaniec: string;
};

type Props = { kalendarz: WierszKalendarza[]; eksport: WierszEksportu[] };

function czyDzis(startIso: string, endIso: string) {
  const s = new Date();
  s.setHours(0, 0, 0, 0);
  const jutro0 = new Date(s);
  jutro0.setDate(jutro0.getDate() + 1);
  return new Date(endIso) > s && new Date(startIso) < jutro0;
}

function poczatekTygodniaPl(od: Date) {
  const x = new Date(od);
  const d = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function koniecTygodniaPl(od: Date) {
  const s = poczatekTygodniaPl(od);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

function czyTydzienKalendarzowy(startIso: string, endIso: string, odniesienie: Date) {
  const od = poczatekTygodniaPl(odniesienie);
  const d = koniecTygodniaPl(odniesienie);
  return new Date(endIso) > od && new Date(startIso) < d;
}

function zapisCsv(wiersze: WierszEksportu[]) {
  const nagl =
    "ID;Sala;Status;Start;Koniec;Typ;Tytuł;Liczba osób;Telefon;Złożono;Wynajmujący";
  const wiersz = wiersze.map((r) =>
    [
      r.id,
      r.sala_nazwa,
      r.status,
      r.start_at,
      r.end_at,
      r.event_type,
      r.event_title?.replaceAll(";", ",") ?? "",
      String(r.expected_guests),
      r.contact_phone ?? "",
      r.created_at,
      r.mieszkaniec.replaceAll(";", ","),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(";")
  );
  return "\ufeff" + [nagl, ...wiersz].join("\r\n");
}


export function SoltysRezerwacjeKalendarzEksport({ kalendarz, eksport: daneEksportu }: Props) {
  const [info, ustawInfo] = useState<string | null>(null);
  const teraz = useMemo(() => new Date(), []);

  const dzi = useMemo(
    () => kalendarz.filter((r) => czyDzis(r.start_at, r.end_at)).sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [kalendarz]
  );
  const tydz = useMemo(
    () => kalendarz.filter((r) => czyTydzienKalendarzowy(r.start_at, r.end_at, teraz)).sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [kalendarz, teraz]
  );

  const pobierzCsv = useCallback(() => {
    if (daneEksportu.length === 0) return;
    const blob = new Blob([zapisCsv(daneEksportu)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rezerwacje-swietlic-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [daneEksportu]);

  async function kopiujSzablon(tekst: string) {
    try {
      await navigator.clipboard.writeText(tekst);
      ustawInfo("Skopiowano do schowka.");
      setTimeout(() => ustawInfo(null), 2500);
    } catch {
      ustawInfo("Nie udało się skopiować — zaznacz ręcznie.");
    }
  }

  if (daneEksportu.length === 0 && kalendarz.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 space-y-8">
      <h2 className="font-serif text-xl text-green-950">Dziś, tydzień, eksport</h2>
      {info ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {info}
        </p>
      ) : null}
      <p className="text-sm text-stone-600">
        Poniżej: rezerwacje oczekujące i zatwierdzone w bieżącym oknie kalendarzowym (kolidujące z tym
        dniem lub z bieżącym tygodniem). Aby wysłać własne przypomnienie, skopiuj szablon (SMS, mejl, komunikator)
        na np. dzień przed wydarzeniem.
      </p>

      {daneEksportu.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="w-full text-sm text-stone-600 sm:w-auto sm:pe-2">
            Eksport wszystkich widocznych w arkuszu (ok. 90 dni, z historią): {daneEksportu.length} wierszy
          </p>
          <button
            type="button"
            onClick={pobierzCsv}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Pobierz CSV
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <KolumnaDni tytuł="Dzisiaj" puste="Brak rezerwacji na dziś w Twoich salach (oczekujących lub zatwierdzonych)." wiersze={dzi} kopiujSzablon={kopiujSzablon} />
        <KolumnaDni
          tytuł="Ten tydzień (pn–niedz. według kalendarza lokalnego)"
          puste="W tym tygodniu nic w oknie, które ładujemy — sprawdź listę wniosków u góry albo w innym przedziale w eksporcie."
          wiersze={tydz}
          kopiujSzablon={kopiujSzablon}
        />
      </div>
    </section>
  );
}

function KolumnaDni({
  tytuł,
  wiersze,
  puste,
  kopiujSzablon,
}: {
  tytuł: string;
  wiersze: WierszKalendarza[];
  puste: string;
  kopiujSzablon: (t: string) => void | Promise<void>;
}) {
  if (wiersze.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200/90 bg-stone-50/60 p-4 text-sm text-stone-600">
        <h3 className="font-medium text-stone-800">{tytuł}</h3>
        <p className="mt-2">{puste}</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-semibold text-green-900">{tytuł}</h3>
      <ul className="mt-3 space-y-3">
        {wiersze.map((r) => (
          <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-3.5 text-sm shadow-sm">
            <p className="font-medium text-stone-900">
              {r.sala_nazwa}{" "}
              <span className="text-xs font-normal text-stone-500">
                ({r.status === "pending" ? "oczekuje" : "zatwierdzona"})
              </span>
            </p>
            <p className="text-stone-800">
              {new Date(r.start_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} —{" "}
              {new Date(r.end_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
            </p>
            <p className="text-stone-600">
              {r.event_type}
              {r.event_title ? ` — ${r.event_title}` : ""} · {r.mieszkaniec}
            </p>
            {r.contact_phone ? <p className="text-stone-600">tel. {r.contact_phone}</p> : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  kopiujSzablon(
                    `Dzień dobry, rezerwacja w ${r.sala_nazwa} (${r.status === "pending" ? "w rozpatrzeniu" : "zatwierdzona"}): ` +
                      `${new Date(r.start_at).toLocaleString("pl-PL")} — ${new Date(r.end_at).toLocaleString("pl-PL")}. ` +
                      (r.contact_phone ? `Kontakt: ${r.contact_phone}.` : "Pozdrawiamy.")
                  )
                }
                className="rounded border border-emerald-200/90 bg-emerald-50/80 px-2 py-1 text-xs text-emerald-900 hover:bg-emerald-100/80"
              >
                Kopiuj podsumowanie
              </button>
              <button
                type="button"
                onClick={() =>
                  kopiujSzablon(
                    `Przypomnienie: jutro/wkrotce wydarzenie w ${r.sala_nazwa}. ` +
                      `Poczatek: ${new Date(r.start_at).toLocaleString("pl-PL")}, koniec: ` +
                      `${new Date(r.end_at).toLocaleString("pl-PL")}. ${r.mieszkaniec}.`
                  )
                }
                className="rounded border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-800 hover:bg-stone-100"
              >
                Szablon: przypomnienie
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
