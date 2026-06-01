import type { ZakladkaProfiluWsi } from "@/components/wies/wies-zakladki-profilu";
import { ikonaSekcjiWsi } from "@/lib/wies/ikony-sekcji-wsi";
import {
  czyModulWsiWlaczony,
  ETYKIETY_SEKCJI_WSI,
  type KluczSekcjiWsi,
  type UstawieniaWsiPubliczne,
} from "@/lib/wies/ustawienia-wsi";

type KontekstZakladek = {
  maRynek: boolean;
  maPomocSasiedzka: boolean;
  maBlog: boolean;
  maHistoria: boolean;
  /** Moduł kroniki włączony w ustawieniach (zakładka widoczna także przy pustej kronice). */
  maModulHistoria: boolean;
  maSport: boolean;
  maModulSport: boolean;
  maOrganizacje: boolean;
  maDotacje: boolean;
  maPlanCmentarza: boolean;
  maFotokronika: boolean;
  maGrafika: boolean;
  maSzkola: boolean;
  sciezkaCmentarz: string;
};

const DEFINICJE: {
  klucz: KluczSekcjiWsi;
  href: string | ((ctx: KontekstZakladek) => string);
  label: string;
  widoczna: (ctx: KontekstZakladek) => boolean;
}[] = [
  { klucz: "informacje", href: "#informacje-mieszkancow", label: "Informacje", widoczna: () => true },
  { klucz: "rynek", href: "#sekcja-rynek-lokalny", label: "Rynek", widoczna: (c) => c.maRynek },
  { klucz: "mapa", href: "#sekcja-mapa", label: "Mapa", widoczna: () => true },
  { klucz: "aktualnosci", href: "#sekcja-aktualnosci-laczone", label: "Aktualności", widoczna: () => true },
  { klucz: "pomoc", href: "#sekcja-pomoc-sasiedzka", label: "Pomoc", widoczna: (c) => c.maPomocSasiedzka },
  { klucz: "blog", href: "#sekcja-blog", label: "Blog", widoczna: (c) => c.maBlog },
  { klucz: "historia", href: "#sekcja-historia", label: "Historia", widoczna: (c) => c.maModulHistoria },
  { klucz: "sport", href: "#sekcja-sport", label: "Sport", widoczna: (c) => c.maModulSport },
  { klucz: "organizacje", href: "#sekcja-organizacje", label: "Organizacje", widoczna: (c) => c.maOrganizacje },
  { klucz: "szkola", href: "#sekcja-szkola", label: "Szkoła", widoczna: (c) => c.maSzkola },
  { klucz: "dotacje", href: "#sekcja-dotacje", label: "Dotacje", widoczna: (c) => c.maDotacje },
  { klucz: "transport", href: "#sekcja-transport", label: "Transport", widoczna: () => true },
  { klucz: "rolnictwo", href: "#sekcja-rolnictwo", label: "Rolnictwo", widoczna: () => true },
  { klucz: "swietlica", href: "#swietlice-wsi", label: "Świetlica", widoczna: () => true },
  {
    klucz: "cmentarz",
    href: (c) => c.sciezkaCmentarz,
    label: "Cmentarz",
    widoczna: (c) => c.maPlanCmentarza,
  },
  { klucz: "fotokronika", href: "#fotokronika-wsi", label: "Foto", widoczna: (c) => c.maFotokronika },
  { klucz: "grafika", href: "#galeria-plakatow", label: "Grafika", widoczna: (c) => c.maGrafika },
];

export function zbudujZakladkiProfiluWsi(
  ctx: KontekstZakladek,
  ustawienia: UstawieniaWsiPubliczne,
): ZakladkaProfiluWsi[] {
  const widoczne = DEFINICJE.filter(
    (d) => czyModulWsiWlaczony(ustawienia, d.klucz) && d.widoczna(ctx),
  );
  const kolejnosc = ustawienia.kolejnosc_sekcji;
  widoczne.sort((a, b) => kolejnosc.indexOf(a.klucz) - kolejnosc.indexOf(b.klucz));

  return widoczne.map((d) => {
    const cfg = ustawienia.zakladki[d.klucz];
    const domyslnaEtykieta = ETYKIETY_SEKCJI_WSI[d.klucz].split(" ")[0] ?? d.label;
    return {
      href: typeof d.href === "function" ? d.href(ctx) : d.href,
      label: cfg?.label?.trim() || d.label || domyslnaEtykieta,
      ikona: ikonaSekcjiWsi(d.klucz, cfg?.emoji),
      klucz: d.klucz,
    };
  });
}
