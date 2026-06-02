import { PACZKI_HUB_RYNKU } from "@/lib/marketplace/paczki-szybkie-rynek";
import { czyKategoriaNieruchomosci } from "@/lib/marketplace/nieruchomosci";
import type { OstatnieOgloszenieHub } from "@/lib/marketplace/pobierz-hub-rynku";

const KATEGORIE_MASZYN = new Set(["ciagnik", "kombajn", "maszyna_rolnicza", "pojazd", "narzedzia"]);

function pasujeDoPaczkiHub(ogl: OstatnieOgloszenieHub, idPaczki: string): boolean {
  const kat = ogl.equipment_category ?? ogl.category ?? "";
  const tytul = ogl.title.toLowerCase();

  switch (idPaczki) {
    case "miod":
      return kat === "miod" || tytul.includes("miód") || tytul.includes("miod");
    case "sery":
      return kat === "sery_nabial" || tytul.includes("ser") || tytul.includes("nabiał");
    case "dzialki":
      return czyKategoriaNieruchomosci(kat) || Boolean(ogl.geoportal_parcel_id) || tytul.includes("działk");
    case "maszyny":
      return KATEGORIE_MASZYN.has(kat) || tytul.includes("ciągnik") || tytul.includes("kombajn");
    case "warzywa":
      return kat === "warzywa_owoce" || tytul.includes("warzyw") || tytul.includes("ziemniak");
    case "uslugi":
      return kat === "usluga_z_operatorem" || ogl.listing_type === "usluga";
    default:
      return false;
  }
}

/** Filtruje „Ostatnio na rynkach” po aktywnej paczce / frazie z huba. */
export function filtrujOstatnieHub(ostatnie: OstatnieOgloszenieHub[], fraza: string): OstatnieOgloszenieHub[] {
  const q = fraza.trim().toLowerCase();
  if (!q) return ostatnie;

  const paczka = PACZKI_HUB_RYNKU.find((p) => p.fraza.toLowerCase() === q);
  if (paczka) {
    return ostatnie.filter((o) => pasujeDoPaczkiHub(o, paczka.id));
  }

  return ostatnie.filter((o) => {
    const kat = o.equipment_category ?? o.category ?? "";
    const haystack = [o.title, o.nazwaWsi, o.gmina, kat].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}
