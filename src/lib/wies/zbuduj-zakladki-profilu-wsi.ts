import type { ZakladkaProfiluWsi } from "@/components/wies/wies-zakladki-profilu";
import {
  czyModulWsiWlaczony,
  type KluczSekcjiWsi,
  type UstawieniaWsiPubliczne,
} from "@/lib/wies/ustawienia-wsi";

type KontekstZakladek = {
  maRynek: boolean;
  maPomocSasiedzka: boolean;
  maBlogLubHistorie: boolean;
  maOrganizacje: boolean;
  maDotacje: boolean;
  maPlanCmentarza: boolean;
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
  { klucz: "pomoc", href: "#sekcja-pomoc-sasiedzka", label: "Pomoc sąsiedzka", widoczna: (c) => c.maPomocSasiedzka },
  { klucz: "blog", href: "#sekcja-blog-historia", label: "Blog", widoczna: (c) => c.maBlogLubHistorie },
  { klucz: "organizacje", href: "#sekcja-organizacje", label: "Organizacje", widoczna: (c) => c.maOrganizacje },
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

  return widoczne.map((d) => ({
    href: typeof d.href === "function" ? d.href(ctx) : d.href,
    label: d.label,
  }));
}
