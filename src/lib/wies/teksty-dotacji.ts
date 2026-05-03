const ETYKIETY_KATEGORII: Record<string, string> = {
  fundusz_solecki: "Fundusz sołecki",
  gmina_powiat_woj: "Gmina / powiat / województwo",
  ue_prow: "UE / PROW / programy krajowe",
  ngo_fundacja: "Fundacje i NGO",
  sponsor: "Sponsorzy i partnerzy",
  inne: "Inne",
};

export function etykietaKategoriiDotacji(kategoria: string): string {
  return ETYKIETY_KATEGORII[kategoria] ?? kategoria;
}

const DNIE_PL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

export function nazwaDniaTygodnia(dow: number): string {
  if (dow < 0 || dow > 6) return "—";
  return DNIE_PL[dow] ?? "—";
}
