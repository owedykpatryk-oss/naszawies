import type { ZakladkaProfiluWsi } from "@/components/wies/wies-zakladki-profilu";

type Opcje = {
  maCiekawostki: boolean;
  maCentrumWspomnien: boolean;
  maDyskusje: boolean;
};

/** Wstawia zakładki do sekcji społecznościowych tuż po „Mapa”. */
export function dolaczZakladkiSpolecznoscioweProfilu(
  zakladki: ZakladkaProfiluWsi[],
  opcje: Opcje,
): ZakladkaProfiluWsi[] {
  const dodatkowe: ZakladkaProfiluWsi[] = [];
  if (opcje.maCiekawostki) {
    dodatkowe.push({ href: "#sekcja-ciekawostki", label: "Ciekawostki", ikona: "💡" });
  }
  if (opcje.maCentrumWspomnien) {
    dodatkowe.push({ href: "#centrum-wspomnien", label: "Pamięć", ikona: "📜" });
  }
  if (opcje.maDyskusje) {
    dodatkowe.push({ href: "#sekcja-dyskusje-publiczne", label: "Dyskusje", ikona: "💬" });
  }
  if (dodatkowe.length === 0) return zakladki;

  const idxMapa = zakladki.findIndex((z) => z.href === "#sekcja-mapa");
  const insertAt = idxMapa >= 0 ? idxMapa + 1 : zakladki.length;
  return [...zakladki.slice(0, insertAt), ...dodatkowe, ...zakladki.slice(insertAt)];
}
