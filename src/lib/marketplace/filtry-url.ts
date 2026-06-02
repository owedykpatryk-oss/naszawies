export type FiltryRynkuUrl = {
  fraza: string;
  typ: string;
  kategoria: string;
  sortowanie: "najnowsze" | "najstarsze" | "polecane" | "popularne" | "cena-rosnaco" | "cena-malejaco";
  tylkoZOperatorem: boolean;
  tylkoProduktyLokalne: boolean;
  tylkoZweryfikowane: boolean;
  tylkoNieruchomosci: boolean;
  tylkoZMapaGeoportal: boolean;
  minM2: string;
  maxM2: string;
  minCena: string;
  maxCena: string;
  widok: "siatka" | "lista";
};

export const DOMYSLNE_FILTRY_RYNKU: FiltryRynkuUrl = {
  fraza: "",
  typ: "wszystkie",
  kategoria: "wszystkie",
  sortowanie: "najnowsze",
  tylkoZOperatorem: false,
  tylkoProduktyLokalne: false,
  tylkoZweryfikowane: false,
  tylkoNieruchomosci: false,
  tylkoZMapaGeoportal: false,
  minM2: "",
  maxM2: "",
  minCena: "",
  maxCena: "",
  widok: "siatka",
};

export function filtryRynkuZUrl(params: URLSearchParams): FiltryRynkuUrl {
  const sort = params.get("sort");
  const widok = params.get("widok");
  return {
    fraza: params.get("q") ?? "",
    typ: params.get("typ") ?? "wszystkie",
    kategoria: params.get("kat") ?? "wszystkie",
    sortowanie:
      sort === "najstarsze" ||
      sort === "polecane" ||
      sort === "popularne" ||
      sort === "cena_asc" ||
      sort === "cena_desc"
        ? sort === "cena_asc"
          ? "cena-rosnaco"
          : sort === "cena_desc"
            ? "cena-malejaco"
            : sort
        : "najnowsze",
    tylkoZOperatorem: params.get("operator") === "1",
    tylkoProduktyLokalne: params.get("lokalne") === "1",
    tylkoZweryfikowane: params.get("zweryf") === "1",
    tylkoNieruchomosci: params.get("nieruch") === "1",
    tylkoZMapaGeoportal: params.get("geoportal") === "1",
    minM2: params.get("minM2") ?? "",
    maxM2: params.get("maxM2") ?? "",
    minCena: params.get("minCena") ?? "",
    maxCena: params.get("maxCena") ?? "",
    widok: widok === "lista" ? "lista" : "siatka",
  };
}

export function urlZFiltramiRynku(f: FiltryRynkuUrl): string {
  const p = new URLSearchParams();
  if (f.fraza.trim()) p.set("q", f.fraza.trim());
  if (f.typ !== "wszystkie") p.set("typ", f.typ);
  if (f.kategoria !== "wszystkie") p.set("kat", f.kategoria);
  if (f.sortowanie !== "najnowsze") {
    const sortUrl =
      f.sortowanie === "cena-rosnaco" ? "cena_asc" : f.sortowanie === "cena-malejaco" ? "cena_desc" : f.sortowanie;
    p.set("sort", sortUrl);
  }
  if (f.tylkoZOperatorem) p.set("operator", "1");
  if (f.tylkoProduktyLokalne) p.set("lokalne", "1");
  if (f.tylkoZweryfikowane) p.set("zweryf", "1");
  if (f.tylkoNieruchomosci) p.set("nieruch", "1");
  if (f.tylkoZMapaGeoportal) p.set("geoportal", "1");
  if (f.minM2.trim()) p.set("minM2", f.minM2.trim());
  if (f.maxM2.trim()) p.set("maxM2", f.maxM2.trim());
  if (f.minCena.trim()) p.set("minCena", f.minCena.trim());
  if (f.maxCena.trim()) p.set("maxCena", f.maxCena.trim());
  if (f.widok === "lista") p.set("widok", "lista");
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}
