/** Proponowane daty/godziny po wyborze szablonu sezonowego lub tematycznego. */

function nastepnaData(miesiac: number, dzien: number): string {
  const teraz = new Date();
  const rok = teraz.getFullYear();
  const dzisStart = new Date(rok, teraz.getMonth(), teraz.getDate()).getTime();
  let cel = new Date(rok, miesiac - 1, dzien, 12, 0, 0);
  if (cel.getTime() < dzisStart) {
    cel = new Date(rok + 1, miesiac - 1, dzien, 12, 0, 0);
  }
  return cel.toISOString().slice(0, 10);
}

export function sugerowaneDatySezonowe(
  szablonId: string,
  tagi: string[] = [],
): Partial<Record<"data" | "godzina", string>> {
  const id = szablonId.toLowerCase();
  const tagiL = tagi.map((t) => t.toLowerCase());

  if (id.includes("dzien-dziecka") || tagiL.some((t) => t.includes("dzień dziecka") || t.includes("dzieci"))) {
    return { data: nastepnaData(6, 1), godzina: "15:00" };
  }
  if (id.startsWith("sezon-mikolajki") || tagiL.includes("mikołajki")) {
    return { data: nastepnaData(12, 6), godzina: "16:00" };
  }
  if (id.startsWith("sezon-dozynki") || tagiL.includes("dożynki")) {
    return { data: nastepnaData(8, 15), godzina: "14:00" };
  }
  if (id.includes("wigilia") || tagiL.includes("wigilia")) {
    return { data: nastepnaData(12, 20), godzina: "17:00" };
  }
  if (id.startsWith("sezon-wielkanoc")) {
    return { data: nastepnaData(4, 20), godzina: "12:00" };
  }
  if (id.startsWith("sezon-dzien-kobiet")) {
    return { data: nastepnaData(3, 8), godzina: "17:00" };
  }
  if (id.startsWith("sezon-dni-seniora") || tagiL.includes("seniorzy")) {
    return { data: nastepnaData(10, 1), godzina: "16:00" };
  }
  if (id.startsWith("sezon-sylwester")) {
    return { data: nastepnaData(12, 31), godzina: "20:00" };
  }
  if (id.includes("11-listopada") || tagiL.some((t) => t.includes("patriot") || t.includes("niepodleg"))) {
    return { data: nastepnaData(11, 11), godzina: "10:00" };
  }
  if (id.includes("ognisko") || tagiL.includes("jesień")) {
    return { data: nastepnaData(10, 15), godzina: "18:00" };
  }
  if (id.includes("zebranie") || id.includes("tablica")) {
    return { godzina: "18:00" };
  }
  if (id.includes("swietlic") || tagiL.includes("świetlica")) {
    return { godzina: "17:00" };
  }
  return {};
}

export function uzupelnijWartosciDatamiSezonowymi(
  wartosci: Record<string, string>,
  szablonId: string,
  tagi: string[] = [],
): Record<string, string> {
  const sug = sugerowaneDatySezonowe(szablonId, tagi);
  const out = { ...wartosci };
  if (sug.data && !out.data?.trim()) out.data = sug.data;
  if (sug.godzina && !out.godzina?.trim()) out.godzina = sug.godzina;
  return out;
}
