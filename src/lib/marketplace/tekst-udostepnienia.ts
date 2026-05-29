import { formatujPowierzchnieDzialki } from "@/lib/marketplace/nieruchomosci";
import { etykietaJednostkiCeny } from "@/lib/marketplace/kategorie-ogloszen";

export function zbudujTekstUdostepnieniaOgloszenia(opts: {
  tytul: string;
  cena?: number | null;
  waluta?: string | null;
  jednostka?: string | null;
  powierzchniaM2?: number | null;
  nazwaWsi?: string;
}): string {
  const czesci: string[] = [opts.tytul];
  if (opts.cena != null) {
    const jedn = opts.jednostka ? ` ${etykietaJednostkiCeny(opts.jednostka)}` : "";
    czesci.push(`${opts.cena} ${opts.waluta ?? "PLN"}${jedn}`);
  }
  const pow = formatujPowierzchnieDzialki(opts.powierzchniaM2);
  if (pow) czesci.push(pow);
  if (opts.nazwaWsi) czesci.push(`Rynek lokalny · ${opts.nazwaWsi}`);
  return czesci.join(" · ");
}
