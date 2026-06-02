const MAX_DLUGOSC_POLE_URL = 400;

export type ParametryLinkuGrafiki = {
  /** Domyślnie /panel/soltys/grafika */
  sciezka?: string;
  szablon: string;
  motyw?: string;
  tryb?: "zaproszenie" | "dyplomy" | "edytor";
  wartosci?: Record<string, string>;
  tytulProjektu?: string;
};

/** Link do kreatora z opcjonalnie wstępnie wypełnionymi polami (jak w generatorze dokumentów). */
export function zbudujLinkGrafiki(opcje: ParametryLinkuGrafiki): string {
  const baza = opcje.sciezka ?? "/panel/soltys/grafika";
  const params = new URLSearchParams();
  params.set("szablon", opcje.szablon);
  params.set("tryb", opcje.tryb ?? "zaproszenie");
  if (opcje.motyw) params.set("motyw", opcje.motyw);
  if (opcje.tytulProjektu?.trim()) {
    params.set("tytulProjektu", opcje.tytulProjektu.trim().slice(0, 120));
  }
  if (opcje.wartosci) {
    for (const [klucz, wartosc] of Object.entries(opcje.wartosci)) {
      const v = wartosc?.trim();
      if (v) params.set(klucz, v.slice(0, MAX_DLUGOSC_POLE_URL));
    }
  }
  return `${baza}?${params.toString()}`;
}

/** Wczytuje wartości pól z parametrów URL (pomija metadane kreatora). */
export function wartosciPolZParametrowUrl(
  params: URLSearchParams,
  znanePola: string[],
): Record<string, string> {
  const meta = new Set(["szablon", "motyw", "tryb", "tytulProjektu", "projekt"]);
  const out: Record<string, string> = {};
  for (const id of znanePola) {
    const v = params.get(id)?.trim();
    if (v) out[id] = v;
  }
  for (const [klucz, wartosc] of Array.from(params.entries())) {
    if (meta.has(klucz)) continue;
    const v = wartosc.trim();
    if (v && !(klucz in out)) out[klucz] = v.slice(0, MAX_DLUGOSC_POLE_URL);
  }
  return out;
}
