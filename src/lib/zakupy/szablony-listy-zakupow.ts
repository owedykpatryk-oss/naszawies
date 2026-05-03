/** Szablony listy zakupów (KGW / imprezy) — wczytywane jednym żądaniem. */

export type PozycjaSzablonu = { title: string; quantity_text?: string | null; note?: string | null };

export const SZABLONY_LISTY_ZAKUPOW: Record<string, { nazwa: string; pozycje: PozycjaSzablonu[] }> = {
  wigilia: {
    nazwa: "Wigilia (baza)",
    pozycje: [
      { title: "Mąka pszenna", quantity_text: "1 kg" },
      { title: "Bułka tarta", quantity_text: "1 opak." },
      { title: "Mak", quantity_text: "200 g" },
      { title: "Miód / suszone owoce", note: "do kutii" },
      { title: "Kapusta kiszona", quantity_text: "słoik" },
      { title: "Grzyby suszone", note: "namoczyć wcześniej" },
      { title: "Śmietana 30%", quantity_text: "2 op." },
      { title: "Ryby (karp, śledzie)", note: "ustalić z dostawcą" },
    ],
  },
  dozynki: {
    nazwa: "Dożynki / festyn (baza)",
    pozycje: [
      { title: "Woda butelkowana", quantity_text: "3 skrzynki" },
      { title: "Kubki jednorazowe", quantity_text: "2 op." },
      { title: "Serwetki", quantity_text: "1 op." },
      { title: "Worki na śmieci 120 l", quantity_text: "1 rolka" },
      { title: "Folia na stoły", note: "jeśli są stoły pod chmurką" },
    ],
  },
  kgw_sernik: {
    nazwa: "KGW — sernik i ciasta",
    pozycje: [
      { title: "Ser twarogowy / sernikowy", quantity_text: "2 kg" },
      { title: "Jajka", quantity_text: "20 szt." },
      { title: "Cukier", quantity_text: "1 kg" },
      { title: "Masło", quantity_text: "500 g" },
      { title: "Śmietanka kremówka", quantity_text: "500 ml" },
    ],
  },
};

export function listaKluczySzablonow(): { id: string; nazwa: string }[] {
  return Object.entries(SZABLONY_LISTY_ZAKUPOW).map(([id, v]) => ({ id, nazwa: v.nazwa }));
}
