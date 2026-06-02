export type FazaPolowaniaMapy = "aktywne" | "nadchodzace";

export function fazaPolowania(startsAt: string, endsAt: string, teraz = new Date()): FazaPolowaniaMapy {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (teraz >= start && teraz <= end) return "aktywne";
  return "nadchodzace";
}

/** Krótki tekst odliczania do startu lub końca polowania. */
export function tekstOdliczaniaPolowania(
  startsAt: string,
  endsAt: string,
  teraz = new Date(),
): string | null {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (teraz < start) {
    const ms = start.getTime() - teraz.getTime();
    return formatujPozostalyCzas(ms, "Start za");
  }
  if (teraz <= end) {
    const ms = end.getTime() - teraz.getTime();
    return formatujPozostalyCzas(ms, "Koniec za");
  }
  return null;
}

function formatujPozostalyCzas(ms: number, prefiks: string): string {
  if (ms <= 0) return `${prefiks}: teraz`;
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${prefiks}: ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${prefiks}: ${h} h`;
  const d = Math.floor(h / 24);
  return `${prefiks}: ${d} d`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Odliczanie HH:MM:SS do startu lub końca (dla listy na mapie). */
export function odliczanieZywHms(
  startsAt: string,
  endsAt: string,
  teraz = new Date(),
): { etykieta: string; hms: string } | null {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (teraz < start) {
    const ms = start.getTime() - teraz.getTime();
    return { etykieta: "Start za", hms: formatujHms(ms) };
  }
  if (teraz <= end) {
    const ms = end.getTime() - teraz.getTime();
    return { etykieta: "Koniec za", hms: formatujHms(ms) };
  }
  return null;
}

/** Data i godzina polowania (lista na mapie). */
export function formatujDatePolowania(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatujHms(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 99) return "99:59:59";
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}
