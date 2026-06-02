import type { KontekstGrafiki, WartosciPolGrafiki } from "./typy";
import { domyslneWartosciPol, znajdzSzablon } from "./szablony";

function parsujDataMiejsce(tekst: string): Partial<WartosciPolGrafiki> {
  const out: Partial<WartosciPolGrafiki> = {};
  if (!tekst?.trim()) return out;

  for (const linia of tekst.split("\n")) {
    const l = linia.trim();
    const dataMatch = l.match(/^data\s*:\s*(.+)$/i);
    if (dataMatch) {
      const frag = dataMatch[1].trim();
      const iso = frag.match(/(\d{4}-\d{2}-\d{2})/);
      if (iso) out.data = iso[1];
      continue;
    }
    const godzMatch = l.match(/^godzin[aę]?\s*:\s*(.+)$/i) || l.match(/^od\s+(\d{1,2}:\d{2})/i);
    if (godzMatch) {
      const g = godzMatch[1].replace(/^godz\.?\s*/i, "").trim();
      if (/^\d{1,2}:\d{2}/.test(g)) out.godzina = g.slice(0, 5);
      continue;
    }
    const miejsceMatch = l.match(/^miejsce\s*:\s*(.+)$/i);
    if (miejsceMatch) {
      out.miejsce = miejsceMatch[1].trim();
    }
  }

  const isoWtekscie = tekst.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoWtekscie && !out.data) out.data = isoWtekscie[1];

  const godzWtekscie = tekst.match(/godz\.?\s*(\d{1,2}:\d{2})/i);
  if (godzWtekscie && !out.godzina) out.godzina = godzWtekscie[1];

  return out;
}

/** Mapuje pola z presetu / scenariusza dokumentu na pola szablonu graficznego. */
export function mapujPolaDokumentuNaGrafike(
  uzupelnienia: Record<string, string>,
): Partial<WartosciPolGrafiki> {
  const out: Partial<WartosciPolGrafiki> = {};

  if (uzupelnienia.tytul_wyd?.trim()) out.tytul = uzupelnienia.tytul_wyd.trim();
  if (uzupelnienia.tytul?.trim() && !out.tytul) out.tytul = uzupelnienia.tytul.trim();
  if (uzupelnienia.temat?.trim() && !out.tytul) out.tytul = uzupelnienia.temat.trim();
  if (uzupelnienia.laureat?.trim()) out.tytul = uzupelnienia.laureat.trim();
  if (uzupelnienia.nagroda?.trim()) out.naglowek = uzupelnienia.nagroda.trim();

  const opisCzesci = [
    uzupelnienia.opis,
    uzupelnienia.tresc,
    uzupelnienia.uzasadnienie,
    uzupelnienia.porzadek,
    uzupelnienia.zalecenia,
    uzupelnienia.wsparcie && uzupelnienia.efekt
      ? `${uzupelnienia.wsparcie}\n\n${uzupelnienia.efekt}`
      : uzupelnienia.wsparcie || uzupelnienia.efekt,
    uzupelnienia.cel && !uzupelnienia.opis ? `Cel: ${uzupelnienia.cel}` : null,
    uzupelnienia.harmonogram,
    uzupelnienia.zakres,
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (opisCzesci) out.opis = opisCzesci;

  if (uzupelnienia.miejsce?.trim()) out.miejsce = uzupelnienia.miejsce.trim();
  if (uzupelnienia.kontakt?.trim()) out.kontakt = uzupelnienia.kontakt.trim();
  if (uzupelnienia.podpis?.trim()) out.organizator = uzupelnienia.podpis.trim();
  if (uzupelnienia.podpis1?.trim()) out.podpis1 = uzupelnienia.podpis1.trim();
  if (uzupelnienia.podpis2?.trim()) out.podpis2 = uzupelnienia.podpis2.trim();
  if (uzupelnienia.jednostka?.trim() && !out.organizator) out.organizator = uzupelnienia.jednostka.trim();

  Object.assign(out, parsujDataMiejsce(uzupelnienia.data_miejsce ?? ""));

  if (uzupelnienia.data?.trim() && !out.data) {
    const iso = uzupelnienia.data.match(/\d{4}-\d{2}-\d{2}/);
    out.data = iso ? iso[0] : uzupelnienia.data.trim();
  }

  return out;
}

export function mapujPresetNaGrafike(
  szablonGrafikiId: string,
  uzupelnieniaDokumentu: Record<string, string>,
  kontekst: KontekstGrafiki,
): WartosciPolGrafiki {
  const szablon = znajdzSzablon(szablonGrafikiId);
  const bazowe = szablon ? domyslneWartosciPol(szablon, kontekst) : {};
  const zmapowane = mapujPolaDokumentuNaGrafike(uzupelnieniaDokumentu);
  const scalone = { ...bazowe, ...zmapowane };
  const out: WartosciPolGrafiki = {};
  for (const [k, v] of Object.entries(scalone)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
