/** Termin zajęcia sali (bez danych osobowych). */
export type TerminKalendarza = {
  start_at: string;
  end_at: string;
};

export type StanDniaKalendarza = "wolny" | "zajety" | "bufor";

const DNI_TYGODNIA_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"] as const;

export { DNI_TYGODNIA_PL };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Klucz dnia w strefie lokalnej przeglądarki / serwera. */
export function kluczDniaLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parsujKluczDnia(klucz: string): Date {
  const [y, m, d] = klucz.split("-").map((x) => Number.parseInt(x, 10));
  return new Date(y, m - 1, d);
}

function dodajDni(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

/** Dni kalendarzowe nachodzące na przedział [start, end). */
export function dniZajeteTerminu(startIso: string, endIso: string): string[] {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return [];

  const out: string[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cur <= endDay) {
    const dayStart = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
    const dayEnd = dodajDni(cur, 1);
    if (start < dayEnd && end > dayStart) {
      out.push(kluczDniaLocal(cur));
    }
    cur = dodajDni(cur, 1);
  }
  return out;
}

/**
 * Mapa stanów dni w miesiącu: zajęte (wydarzenie) + bufor (dzień przed/po bloku rezerwacji).
 * Jeśli ktoś rezerwuje cały weekend (pt–nd), bufor nie nakłada się na te dni.
 */
export function obliczMapeStanowDni(
  terminy: TerminKalendarza[],
  rok: number,
  miesiac: number,
): Map<string, StanDniaKalendarza> {
  const zajete = new Set<string>();
  const bufor = new Set<string>();

  for (const t of terminy) {
    const dni = dniZajeteTerminu(t.start_at, t.end_at);
    if (dni.length === 0) continue;
    for (const k of dni) zajete.add(k);

    const pierwszy = parsujKluczDnia(dni[0]!);
    const ostatni = parsujKluczDnia(dni[dni.length - 1]!);
    bufor.add(kluczDniaLocal(dodajDni(pierwszy, -1)));
    bufor.add(kluczDniaLocal(dodajDni(ostatni, 1)));
  }

  const mapa = new Map<string, StanDniaKalendarza>();
  const pierwszyDzien = new Date(rok, miesiac, 1);
  const ostatniDzien = new Date(rok, miesiac + 1, 0);

  for (let d = new Date(pierwszyDzien); d <= ostatniDzien; d = dodajDni(d, 1)) {
    const k = kluczDniaLocal(d);
    if (zajete.has(k)) mapa.set(k, "zajety");
    else if (bufor.has(k)) mapa.set(k, "bufor");
    else mapa.set(k, "wolny");
  }

  return mapa;
}

/** Siatka 6 tygodni (poniedziałek jako pierwszy dzień tygodnia). */
export function siatkaMiesiaca(rok: number, miesiac: number): { data: Date; wBiezacymMiesiacu: boolean }[] {
  const pierwszy = new Date(rok, miesiac, 1);
  const start = dodajDni(pierwszy, -((pierwszy.getDay() + 6) % 7));
  const komorki: { data: Date; wBiezacymMiesiacu: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const data = dodajDni(start, i);
    komorki.push({
      data,
      wBiezacymMiesiacu: data.getMonth() === miesiac,
    });
  }
  return komorki;
}

export function etykietaMiesiaca(rok: number, miesiac: number): string {
  return new Date(rok, miesiac, 1).toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
}

export function terminyNaDniu(terminy: TerminKalendarza[], klucz: string): TerminKalendarza[] {
  const dayStart = parsujKluczDnia(klucz);
  const dayEnd = dodajDni(dayStart, 1);
  return terminy.filter((t) => {
    const s = new Date(t.start_at);
    const e = new Date(t.end_at);
    return s < dayEnd && e > dayStart;
  });
}
