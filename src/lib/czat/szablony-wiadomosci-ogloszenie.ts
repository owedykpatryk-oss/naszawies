/** Gotowe wiadomości przy czacie o ogłoszeniu na rynku lokalnym. */
export const SZABLONY_CZAT_OGLOSZENIE = [
  "Czy produkt jest jeszcze dostępny?",
  "Czy możliwy odbiór dziś?",
  "Czy można negocjować cenę?",
  "Czy możliwa dostawa w okolicy?",
] as const;

export const SZABLONY_CZAT_NIERUCHOMOSCI = [
  "Czy można obejrzeć działkę?",
  "Czy numer działki się zgadza?",
  "Czy są dokumenty do wglądu?",
  "Czy możliwa wizyta w weekend?",
] as const;

export function szablonyCzatuDlaOgloszenia(czyNieruchomosc: boolean): readonly string[] {
  return czyNieruchomosc ? SZABLONY_CZAT_NIERUCHOMOSCI : SZABLONY_CZAT_OGLOSZENIE;
}
