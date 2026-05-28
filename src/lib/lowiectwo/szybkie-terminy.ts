/** Presety dat dla formularza polowania (datetime-local). */

export type PresetTerminu = {
  id: string;
  etykieta: string;
  startsAt: string;
  endsAt: string;
};

function doDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function poczatekDnia(d: Date, godz = 6): Date {
  const x = new Date(d);
  x.setHours(godz, 0, 0, 0);
  return x;
}

function koniecDnia(d: Date, godz = 18): Date {
  const x = new Date(d);
  x.setHours(godz, 0, 0, 0);
  return x;
}

export function presetyTerminowPolowania(teraz = new Date()): PresetTerminu[] {
  const jutro = new Date(teraz);
  jutro.setDate(jutro.getDate() + 1);

  const sobota = new Date(teraz);
  const dzien = sobota.getDay();
  const dniDoSoboty = (6 - dzien + 7) % 7 || 7;
  sobota.setDate(sobota.getDate() + dniDoSoboty);
  const niedziela = new Date(sobota);
  niedziela.setDate(niedziela.getDate() + 1);

  const poniedzialek = new Date(teraz);
  const doPon = ((8 - poniedzialek.getDay()) % 7) || 7;
  poniedzialek.setDate(poniedzialek.getDate() + doPon);
  const piatek = new Date(poniedzialek);
  piatek.setDate(piatek.getDate() + 4);

  const za2h = new Date(teraz.getTime() + 2 * 60 * 60 * 1000);
  const koniecDzis = koniecDnia(teraz, 20);

  return [
    {
      id: "za2h",
      etykieta: "Od teraz · 2 h",
      startsAt: doDatetimeLocal(teraz),
      endsAt: doDatetimeLocal(za2h > koniecDzis ? koniecDzis : za2h),
    },
    {
      id: "dzis",
      etykieta: "Dziś 6:00–18:00",
      startsAt: doDatetimeLocal(poczatekDnia(teraz)),
      endsAt: doDatetimeLocal(koniecDnia(teraz)),
    },
    {
      id: "jutro",
      etykieta: "Jutro 6:00–18:00",
      startsAt: doDatetimeLocal(poczatekDnia(jutro)),
      endsAt: doDatetimeLocal(koniecDnia(jutro)),
    },
    {
      id: "weekend",
      etykieta: "Weekend (sob.–niedz.)",
      startsAt: doDatetimeLocal(poczatekDnia(sobota)),
      endsAt: doDatetimeLocal(koniecDnia(niedziela)),
    },
    {
      id: "tydzien",
      etykieta: "Tydzień (pon.–pt.)",
      startsAt: doDatetimeLocal(poczatekDnia(poniedzialek)),
      endsAt: doDatetimeLocal(koniecDnia(piatek)),
    },
  ];
}
