/** Minimalny generator pliku iCalendar (.ics) — wydarzenia wsi. */
export function utworzPlikIcs(opts: {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt?: Date | null;
  url?: string | null;
}): string {
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const start = opts.startAt;
  const end =
    opts.endAt && !Number.isNaN(opts.endAt.getTime())
      ? opts.endAt
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//naszawies.pl//Wydarzenia wsi//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@naszawies.pl`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(opts.title)}`,
  ];
  if (opts.description?.trim()) {
    lines.push(`DESCRIPTION:${esc(opts.description.trim())}`);
  }
  if (opts.location?.trim()) {
    lines.push(`LOCATION:${esc(opts.location.trim())}`);
  }
  if (opts.url?.trim()) {
    lines.push(`URL:${opts.url.trim()}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export type WpisIcs = {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt?: Date | null;
  url?: string | null;
};

/** Wiele wydarzeń w jednym pliku .ics (np. kalendarz sołtysa). */
export function utworzPlikIcsWiele(wydarzenia: WpisIcs[], nazwaKalendarza = "Kalendarz naszawies.pl"): string {
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//naszawies.pl//Kalendarz sołtysa//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(nazwaKalendarza)}`,
  ];

  for (const w of wydarzenia) {
    const start = w.startAt;
    const end =
      w.endAt && !Number.isNaN(w.endAt.getTime())
        ? w.endAt
        : new Date(start.getTime() + (w.endAt === null ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000));

    lines.push(
      "BEGIN:VEVENT",
      `UID:${w.uid}@naszawies.pl`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${esc(w.title)}`,
    );
    if (w.description?.trim()) lines.push(`DESCRIPTION:${esc(w.description.trim())}`);
    if (w.location?.trim()) lines.push(`LOCATION:${esc(w.location.trim())}`);
    if (w.url?.trim()) lines.push(`URL:${w.url.trim()}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
