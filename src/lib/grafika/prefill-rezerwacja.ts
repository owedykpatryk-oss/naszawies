import type { KontekstGrafiki, WartosciPolGrafiki } from "./typy";
import { znajdzSzablon } from "./szablony";

export type PrefillRezerwacji = {
  szablonId: string;
  wartosci: WartosciPolGrafiki;
  tytulProjektu: string;
  bookingId?: string;
};

const MAPA_TYPOW: Record<string, string> = {
  urodziny: "zaproszenie-urodziny",
  wesele: "zaproszenie-wesele-sala",
  zebranie: "zaproszenie-zebranie",
  zajecia: "zaproszenie-impreza-wies",
  inne: "zaproszenie-impreza-wies",
};

function dataIsoZTimestamp(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function godzinaZTimestamp(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export function zbudujPrefillZRezerwacji(opcje: {
  eventType: string;
  eventTitle?: string | null;
  startAt: string;
  endAt: string;
  hallName: string;
  villageName: string;
  bookingId?: string;
  kontekst: KontekstGrafiki;
}): PrefillRezerwacji {
  const szablonId = MAPA_TYPOW[opcje.eventType] ?? "zaproszenie-impreza-wies";
  const szablon = znajdzSzablon(szablonId);
  const tytulWydarzenia =
    opcje.eventTitle?.trim() ||
    (opcje.eventType === "wesele"
      ? "Uroczystość w sali wiejskiej"
      : opcje.eventType === "urodziny"
        ? "Urodziny"
        : "Wydarzenie w świetlicy");

  const wartosci: WartosciPolGrafiki = {
    naglowek: "Serdecznie zapraszamy",
    tytul: tytulWydarzenia,
    opis: `Rezerwacja sali: ${opcje.hallName}. Zapraszamy na wspólną uroczystość w naszej wsi.`,
    data: dataIsoZTimestamp(opcje.startAt),
    godzina: godzinaZTimestamp(opcje.startAt),
    miejsce: `${opcje.hallName}, ${opcje.villageName}`,
    organizator: opcje.kontekst.organizator || `Sołectwo ${opcje.villageName}`,
    kontakt: "tel. …",
  };

  if (szablon) {
    for (const pole of szablon.pola) {
      if (!(pole.id in wartosci) && pole.domysl) {
        wartosci[pole.id] = pole.domysl
          .replace(/\{\{wies\}\}/g, opcje.villageName)
          .replace(/\{\{gmina\}\}/g, opcje.kontekst.gmina ?? "…");
      }
    }
  }

  return {
    szablonId,
    wartosci,
    tytulProjektu: `${tytulWydarzenia} — ${opcje.hallName}`,
    bookingId: opcje.bookingId,
  };
}

export function parsujParametryPrefillRezerwacji(
  params: Record<string, string | string[] | undefined>,
): {
  eventType: string;
  eventTitle: string | null;
  startAt: string;
  endAt: string;
  hallName: string;
  bookingId: string | null;
} | null {
  const startAt = typeof params.start === "string" ? params.start : null;
  const hallName = typeof params.sala === "string" ? params.sala : null;
  if (!startAt || !hallName) return null;
  return {
    eventType: typeof params.typ === "string" ? params.typ : "inne",
    eventTitle: typeof params.tytul === "string" ? params.tytul : null,
    startAt,
    endAt: typeof params.koniec === "string" ? params.koniec : startAt,
    hallName,
    bookingId: typeof params.rezerwacja === "string" ? params.rezerwacja : null,
  };
}
