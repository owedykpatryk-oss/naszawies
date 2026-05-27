import type { WartosciPolGrafiki } from "./typy";

/** Łączy pole daty i godziny z szablonu w ISO (lokalna strefa → UTC). */
export function parsujDateTimeZWartosci(wartosci: WartosciPolGrafiki): {
  startsAt: string | null;
  endsAt: string | null;
} {
  const data = wartosci.data?.trim();
  if (!data) return { startsAt: null, endsAt: null };

  const godzinaRaw = wartosci.godzina?.trim() ?? "";
  const dopasowanie = /^(\d{1,2}):(\d{2})/.exec(godzinaRaw);
  const hh = dopasowanie ? String(Number(dopasowanie[1])).padStart(2, "0") : "12";
  const mm = dopasowanie ? dopasowanie[2] : "00";

  const start = new Date(`${data}T${hh}:${mm}:00`);
  if (Number.isNaN(start.getTime())) {
    return { startsAt: null, endsAt: null };
  }

  return { startsAt: start.toISOString(), endsAt: null };
}

export function tytulWydarzeniaZWartosci(wartosci: WartosciPolGrafiki, fallback: string): string {
  return (
    wartosci.tytul?.trim() ||
    wartosci.naglowek?.trim() ||
    fallback
  ).slice(0, 200);
}

export function opisWydarzeniaZWartosci(wartosci: WartosciPolGrafiki): string | null {
  const opis = wartosci.opis?.trim();
  return opis ? opis.slice(0, 8000) : null;
}

export function miejsceWydarzeniaZWartosci(wartosci: WartosciPolGrafiki): string | null {
  const m = wartosci.miejsce?.trim();
  return m ? m.slice(0, 240) : null;
}
