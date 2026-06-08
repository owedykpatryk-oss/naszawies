/** Presety dat dla ostrzeżeń leśnych w panelu sołtysa. */
export function presetyTerminowLesnych(): {
  id: string;
  etykieta: string;
  startsAt: string;
  endsAt: string;
}[] {
  const teraz = new Date();
  const doIso = (d: Date) => {
    const l = new Date(d);
    l.setMinutes(l.getMinutes() - l.getTimezoneOffset());
    return l.toISOString().slice(0, 16);
  };

  const dzisKoniec = new Date(teraz);
  dzisKoniec.setHours(20, 0, 0, 0);
  if (dzisKoniec <= teraz) {
    dzisKoniec.setDate(dzisKoniec.getDate() + 1);
    dzisKoniec.setHours(20, 0, 0, 0);
  }

  const jutro = new Date(teraz);
  jutro.setDate(jutro.getDate() + 1);
  jutro.setHours(6, 0, 0, 0);
  const jutroKoniec = new Date(jutro);
  jutroKoniec.setHours(18, 0, 0, 0);

  const tydzien = new Date(teraz);
  tydzien.setHours(0, 0, 0, 0);
  const tydzienKoniec = new Date(tydzien);
  tydzienKoniec.setDate(tydzienKoniec.getDate() + 7);
  tydzienKoniec.setHours(23, 59, 0, 0);

  const miesiac = new Date(teraz);
  miesiac.setHours(0, 0, 0, 0);
  const miesiacKoniec = new Date(miesiac);
  miesiacKoniec.setDate(miesiacKoniec.getDate() + 30);
  miesiacKoniec.setHours(23, 59, 0, 0);

  return [
    { id: "dzis", etykieta: "Do dziś wieczorem", startsAt: doIso(teraz), endsAt: doIso(dzisKoniec) },
    { id: "jutro", etykieta: "Jutro (6:00–18:00)", startsAt: doIso(jutro), endsAt: doIso(jutroKoniec) },
    { id: "tydzien", etykieta: "7 dni", startsAt: doIso(tydzien), endsAt: doIso(tydzienKoniec) },
    { id: "miesiac", etykieta: "30 dni", startsAt: doIso(miesiac), endsAt: doIso(miesiacKoniec) },
  ];
}
