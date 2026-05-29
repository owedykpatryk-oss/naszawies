/** Opis generowany przez `dodajPakietOgloszenKgw` w akcje marketplace. */
export const MARKER_OPISU_PAKIETU_KGW = "szablonu KGW / gospodarstwa";

export function czyOgloszenieZPakietuKgw(description: string | null | undefined): boolean {
  return Boolean(description?.includes(MARKER_OPISU_PAKIETU_KGW) || description?.includes("szablonu KGW"));
}
