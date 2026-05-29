/** Ogłoszenia na rynku wsi są widoczne przez 2 tygodnie, potem wymagają ponownej aktywacji. */
export const DNI_WAZNOSCI_OGLOSZENIA_RYNEK = 14;

export function dataWygasnieciaOgloszeniaRynek(od: Date = new Date()): Date {
  const wynik = new Date(od);
  wynik.setDate(wynik.getDate() + DNI_WAZNOSCI_OGLOSZENIA_RYNEK);
  return wynik;
}
