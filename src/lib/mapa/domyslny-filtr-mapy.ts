import type { FiltrAdministracyjny } from "@/components/mapa/mapa-filtr-administracyjny";

/** Domyślny zasięg katalogu — powiat nakielski (start bez zacinania całej Polski). */
export const DOMYSLNY_FILTR_MAPY: FiltrAdministracyjny = {
  wojSlug: "kujawsko-pomorskie",
  powSlug: "nakielski",
  gminaSlug: "",
};

export function filtrAdminZParametrowUrl(params: {
  woj: string | null;
  pow: string | null;
  gmina: string | null;
}): FiltrAdministracyjny {
  if (params.woj || params.pow || params.gmina) {
    return {
      wojSlug: params.woj ?? "",
      powSlug: params.pow ?? "",
      gminaSlug: params.gmina ?? "",
    };
  }
  return { ...DOMYSLNY_FILTR_MAPY };
}

export function czyDomyslnyFiltrPowiatu(filtr: FiltrAdministracyjny): boolean {
  return (
    filtr.wojSlug === DOMYSLNY_FILTR_MAPY.wojSlug &&
    filtr.powSlug === DOMYSLNY_FILTR_MAPY.powSlug &&
    !filtr.gminaSlug
  );
}
