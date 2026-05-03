import { escapeHtml as e } from "@/lib/tekst/escape-html";
import type { OpcjeDomyslneGeneratoraSoltysa, PresetDokumentu } from "./typy";

function v(r: Record<string, string>, key: string): string {
  const t = (r[key] ?? "").trim();
  return t ? e(t) : "—";
}

function stylDruku(): string {
  return `<style>
    .doc-soltys { --akcent: #14532d; --tlo-pasa: #ecfdf5; --ramka: #d6d3d1; --tlo-ramki: #fafaf9; position: relative; isolation: isolate; font-family: "Cambria", "Times New Roman", "Palatino Linotype", serif; color: #1c1917; line-height: 1.55; max-width: 740px; margin: 0 auto; letter-spacing: 0.005em; text-rendering: optimizeLegibility; }
    .doc-soltys.doc-styl-elegancki { --akcent: #7c2d12; --tlo-pasa: #fff7ed; --ramka: #e7d8c9; --tlo-ramki: #fffaf4; font-family: "Palatino Linotype", "Book Antiqua", Garamond, serif; }
    .doc-soltys.doc-styl-nowoczesny { --akcent: #1d4ed8; --tlo-pasa: #eff6ff; --ramka: #cbd5e1; --tlo-ramki: #f8fafc; font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
    .doc-soltys[data-rozmiar="duzy"] { font-size: 1.06rem; line-height: 1.62; }
    .doc-soltys[data-znak-wodny="subtelny"]::before {
      content: "naszawies.pl";
      position: absolute;
      inset: 42% 0 auto 0;
      text-align: center;
      transform: rotate(-18deg);
      font-size: 2.6rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: rgba(17, 94, 89, 0.06);
      pointer-events: none;
      z-index: -1;
      user-select: none;
      font-family: "Inter", "Segoe UI", Arial, sans-serif;
    }
    .doc-soltys h1 { font-size: 1.42rem; margin: 0 0 0.6rem; text-align: center; border-bottom: 2px solid var(--akcent); padding-bottom: 0.5rem; letter-spacing: 0.02em; }
    .doc-soltys .pas-nadtytul { font-size: 0.72rem; color: #44403c; text-align: center; margin: 0 0 0.75rem; padding: 0.45rem 0.65rem; background: var(--tlo-pasa); border: 1px solid var(--ramka); border-radius: 6px; line-height: 1.35; }
    .doc-soltys .pas-nadtytul .nr-ref { font-family: ui-monospace, monospace; font-weight: 600; color: var(--akcent); letter-spacing: 0.03em; }
    .doc-soltys .meta { font-size: 0.8rem; color: #57534e; text-align: center; margin: 0 0 0.35rem; }
    .doc-soltys .meta:last-of-type { margin-bottom: 1.1rem; }
    .doc-soltys h2 { font-size: 1.06rem; margin: 1.25rem 0 0.55rem; color: #0f172a; border-left: 4px solid var(--akcent); padding-left: 0.55rem; }
    .doc-soltys p { margin: 0.42rem 0; text-align: justify; hanging-punctuation: first; orphans: 3; widows: 3; }
    .doc-soltys .mono { font-family: ui-monospace, monospace; font-size: 0.85rem; }
    .doc-soltys .podpis { margin-top: 2.5rem; }
    .doc-soltys .podpisy-siatka { display: grid; gap: 1rem; align-items: start; margin-top: 2.4rem; }
    .doc-soltys .podpisy-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .doc-soltys .podpisy-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .doc-soltys .podpis-kolumna p { margin: 0.15rem 0; text-align: center; font-size: 0.83rem; }
    .doc-soltys .ramka { border: 1px solid var(--ramka); padding: 0.75rem 1rem; margin: 0.75rem 0; border-radius: 4px; background: var(--tlo-ramki); }
    .doc-soltys ul, .doc-soltys ol { margin: 0.5rem 0 0.6rem 1.35rem; }
    .doc-soltys li { margin: 0.2rem 0; }
    .doc-soltys .stopka-tech { font-size: 0.68rem; color: #a8a29e; text-align: center; margin-top: 1.75rem; padding-top: 0.5rem; border-top: 1px solid #e7e5e4; }
    @media print {
      .no-print { display: none !important; }
      .doc-soltys { max-width: none; }
      .doc-soltys .podpisy-siatka { break-inside: avoid; }
      @page { margin: 14mm; size: A4; }
    }
  </style>`;
}

function otoczenie(
  tytul: string,
  meta: {
    dataWygenerowania: string;
    stanNaDzien?: string;
    numerReferencyjny?: string;
    kontekstSolectwa?: string;
    wygenerowalNazwa?: string;
    stylWydruku?: "urzedowy" | "elegancki" | "nowoczesny";
    rozmiarWydruku?: "standard" | "duzy";
    znakWodny?: "brak" | "subtelny";
    ukladPodpisow?: "jeden" | "dwa" | "trzy";
  },
  body: string
): string {
  const stan =
    meta.stanNaDzien && meta.stanNaDzien.trim().length > 0
      ? `<p class="meta"><strong>Stan na dzień:</strong> ${e(meta.stanNaDzien)}</p>`
      : "";
  const nrRef = meta.numerReferencyjny?.trim() ?? "";
  const ref = nrRef ? `<span class="nr-ref">Nr ref. ${e(nrRef)}</span>` : "";
  const kontekst = meta.kontekstSolectwa?.trim() ? e(meta.kontekstSolectwa.trim()) : "";
  const pasNad =
    ref || kontekst
      ? `<div class="pas-nadtytul">${ref ? `${ref}${kontekst ? " · " : ""}` : ""}${kontekst}</div>`
      : "";
  const nazwaGen = meta.wygenerowalNazwa?.trim() ?? "";
  const kto =
    nazwaGen.length > 0
      ? `<p class="meta"><strong>Konto (wygenerował):</strong> ${e(nazwaGen)}</p>`
      : "";
  const stopkaRef = nrRef
    ? `<p class="stopka-tech">Dokument z generatora naszawies.pl · ${e(nrRef)}</p>`
    : `<p class="stopka-tech">Dokument z generatora naszawies.pl</p>`;
  const styl = meta.stylWydruku ?? "urzedowy";
  const rozmiar = meta.rozmiarWydruku ?? "standard";
  const znakWodny = meta.znakWodny ?? "subtelny";
  const ukladPodpisow = meta.ukladPodpisow ?? "jeden";
  const blokPodpisow =
    ukladPodpisow === "jeden"
      ? `<p class="podpis"><em>Miejscowość, data i podpis — uzupełnij odręcznie lub w edytorze po eksporcie do PDF.</em></p>`
      : ukladPodpisow === "dwa"
        ? `<div class="podpis podpisy-siatka podpisy-2">
            <div class="podpis-kolumna"><p>....................................................</p><p><strong>Przewodniczący / Sołtys</strong></p></div>
            <div class="podpis-kolumna"><p>....................................................</p><p><strong>Członek komisji / Zarządu</strong></p></div>
          </div>`
        : `<div class="podpis podpisy-siatka podpisy-3">
            <div class="podpis-kolumna"><p>....................................................</p><p><strong>Przewodniczący / Sołtys</strong></p></div>
            <div class="podpis-kolumna"><p>....................................................</p><p><strong>Członek komisji</strong></p></div>
            <div class="podpis-kolumna"><p>....................................................</p><p><strong>Protokolant / Sekretarz</strong></p></div>
          </div>`;
  return `${stylDruku()}
<div class="doc-soltys doc-styl-${e(styl)}" data-rozmiar="${e(rozmiar)}" data-znak-wodny="${e(znakWodny)}">
  ${pasNad}
  <h1>${e(tytul)}</h1>
  <p class="meta">Wygenerowano w naszawies.pl · ${e(meta.dataWygenerowania)}</p>
  ${kto}
  ${stan}
  ${body}
  ${blokPodpisow}
  ${stopkaRef}
</div>`;
}

export const PRESETY_DOKUMENTOW_SOLTYSA: PresetDokumentu[] = [
  {
    id: "zaproszenie-zebranie",
    kategoria: "Zebranie wiejskie",
    tytul: "Zaproszenie na zebranie wiejskie",
    opis: "Podstawowe zaproszenie z miejscem, datą i porządkiem obrad.",
    pola: [
      { id: "wies", etykieta: "Nazwa sołectwa / wsi", typ: "text", placeholder: "np. Wola", domyslna: "" },
      { id: "gmina", etykieta: "Gmina", typ: "text", placeholder: "np. gmina X" },
      { id: "data_godzina", etykieta: "Data i godzina zebrania", typ: "text", placeholder: "np. 15 marca 2026 r., godz. 18:00" },
      {
        id: "miejsce",
        etykieta: "Miejsce zebrania",
        typ: "text",
        placeholder: "Świetlica wiejska / remiza OSP",
        szybkieWstawki: [
          { etykieta: "Świetlica", wartosc: "Świetlica wiejska" },
          { etykieta: "OSP", wartosc: "Remiza OSP" },
        ],
      },
      {
        id: "porzadek",
        etykieta: "Porządek obrad (skrót)",
        typ: "textarea",
        wiersze: 5,
        placeholder: "1. Otwarcie…\n2. Sprawy…",
        szybkieWstawki: [
          {
            etykieta: "3 punkty",
            wartosc: "1. Otwarcie zebrania.\n2. Sprawy różne.\n3. Zamknięcie.",
          },
          {
            etykieta: "Z funduszem sołeckim",
            wartosc:
              "1. Otwarcie zebrania.\n2. Informacja o funduszu sołeckim i wnioskach.\n3. Dyskusja i głosowanie.\n4. Sprawy różne.\n5. Zamknięcie.",
          },
        ],
      },
      { id: "podpis", etykieta: "Zaprasza (funkcja / imię i nazwisko)", typ: "text", placeholder: "Sołtys …" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Zaproszenie na zebranie wiejskie", meta, `
        <p><strong>Sołectwo:</strong> ${v(w, "wies")}, <strong>gmina</strong> ${v(w, "gmina")}.</p>
        <p>Zapraszam mieszkańców na <strong>zebranie wiejskie</strong>, które odbędzie się w dniu <strong>${v(w, "data_godzina")}</strong>, w <strong>${v(w, "miejsce")}</strong>.</p>
        <h2>Porządek obrad</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "porzadek")}</p></div>
        <p>Z poważaniem — ${v(w, "podpis")}</p>
      `),
  },
  {
    id: "protokol-zebrania",
    kategoria: "Zebranie wiejskie",
    tytul: "Protokół zebrania wiejskiego (szablon)",
    opis: "Frekwencja, uchwały, głosowanie — pola do uzupełnienia po zebraniu.",
    pola: [
      { id: "wies", etykieta: "Sołectwo / wieś", typ: "text" },
      { id: "data", etykieta: "Data zebrania", typ: "date" },
      { id: "przewodniczacy", etykieta: "Przewodniczący zebrania", typ: "text" },
      { id: "sekretarz", etykieta: "Protokolant", typ: "text" },
      {
        id: "frekwencja",
        etykieta: "Frekwencja (np. liczba osób / mandaty)",
        typ: "text",
        placeholder: "np. 23 osoby uprawnione; mandaty: 2",
        szybkieWstawki: [
          { etykieta: "Szablon", wartosc: "Obecnych uprawnionych do głosowania: … osób; mandaty pełnomocnictw: …" },
        ],
      },
      {
        id: "uchwaly",
        etykieta: "Treść uchwał / decyzji",
        typ: "textarea",
        wiersze: 8,
        placeholder: "Uchwała nr … w sprawie …",
        szybkieWstawki: [
          {
            etykieta: "Uchwała formalna",
            wartosc:
              "Uchwała Nr …/2026 z dnia … w sprawie przyjęcia protokołu z zebrania wiejskiego.\n\n§ 1. Przyjmuje się protokół z zebrania z dnia …\n§ 2. Uchwała wchodzi w życie z dniem podjęcia.",
          },
        ],
      },
    ],
    budujHtml: (w, meta) =>
      otoczenie("PROTOKÓŁ ZEBRANIA WIEJSKIEGO", meta, `
        <p><strong>Sołectwo:</strong> ${v(w, "wies")} · <strong>Data:</strong> ${v(w, "data")}</p>
        <p><strong>Przewodniczący:</strong> ${v(w, "przewodniczacy")} · <strong>Protokolant:</strong> ${v(w, "sekretarz")}</p>
        <p><strong>Frekwencja / uprawnienia do głosowania:</strong> ${v(w, "frekwencja")}</p>
        <h2>Przebieg obrad i podjęte uchwały</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "uchwaly")}</p></div>
      `),
  },
  {
    id: "lista-obecnosci",
    kategoria: "Zebranie wiejskie",
    tytul: "Lista obecności na zebraniu",
    opis: "Nagłówek i miejsce na wpisy ręczne lub w tabeli po eksporcie.",
    pola: [
      { id: "wies", etykieta: "Wieś / sołectwo", typ: "text" },
      { id: "data", etykieta: "Data", typ: "date" },
      { id: "temat", etykieta: "Temat zebrania", typ: "text", placeholder: "np. fundusz sołecki 2026" },
      { id: "linie", etykieta: "Liczba linii na wpisy (1–40)", typ: "text", placeholder: "20", domyslna: "20" },
    ],
    budujHtml: (w, meta) => {
      const n = Math.min(40, Math.max(1, parseInt(w.linie || "20", 10) || 20));
      const wiersze = Array.from({ length: n }, (_, i) => `<tr><td style="border:1px solid #ccc;padding:6px;width:2rem">${i + 1}.</td><td style="border:1px solid #ccc;padding:6px;height:1.75rem"></td><td style="border:1px solid #ccc;padding:6px"></td></tr>`).join("");
      return otoczenie("Lista obecności", meta, `
        <p><strong>${v(w, "wies")}</strong> · ${v(w, "data")} · ${v(w, "temat")}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:1rem;font-size:0.9rem"><thead><tr><th style="border:1px solid #78716c;padding:6px">Lp.</th><th style="border:1px solid #78716c;padding:6px">Imię i nazwisko</th><th style="border:1px solid #78716c;padding:6px">Podpis</th></tr></thead><tbody>${wiersze}</tbody></table>
      `);
    },
  },
  {
    id: "pelnomocnictwo-glosowanie",
    kategoria: "Zebranie wiejskie",
    tytul: "Pełnomocnictwo do głosowania na zebraniu",
    opis: "Udzielenie głosu pełnomocnikowi przy określonym zebraniu.",
    pola: [
      { id: "udzielajacy", etykieta: "Ja, niżej podpisany(a)", typ: "text", placeholder: "Imię i nazwisko, adres" },
      { id: "pelnomocnik", etykieta: "Upoważniam do głosowania", typ: "text" },
      { id: "wies", etykieta: "Wieś / sołectwo", typ: "text" },
      { id: "data_zebrania", etykieta: "Data zebrania", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Pełnomocnictwo do głosowania", meta, `
        <p>Ja, <strong>${v(w, "udzielajacy")}</strong>, mieszkaniec(-ka) sołectwa <strong>${v(w, "wies")}</strong>, upoważniam Pana/Panią <strong>${v(w, "pelnomocnik")}</strong> do reprezentowania mnie i wykonywania czynności związanych z udziałem w głosowaniu na zebraniu wiejskim w dniu <strong>${v(w, "data_zebrania")}</strong>, z zachowaniem prawa do odwołania pełnomocnictwa na piśmie przed rozpoczęciem głosowania.</p>
        <p class="ramka"><strong>Uwaga prawna:</strong> treść pełnomocnictwa należy dostosować do uchwały regulaminu zebrania i przepisów o zasadach głosowania w danej gminie.</p>
      `),
  },
  {
    id: "uchwala-projekt",
    kategoria: "Zebranie wiejskie",
    tytul: "Projekt uchwały zebrania wiejskiego",
    opis: "Szkic numeru, tytułu i treści uchwały do dalszej obróbki.",
    pola: [
      { id: "wies", etykieta: "Sołectwo", typ: "text" },
      { id: "nr", etykieta: "Numer projektu uchwały", typ: "text", placeholder: "np. I/2026" },
      { id: "tytul_uchway", etykieta: "Tytuł uchwały", typ: "text" },
      { id: "tresc", etykieta: "Treść uchwały", typ: "textarea", wiersze: 10 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("PROJEKT UCHWAŁY", meta, `
        <p class="mono">Sołectwo: ${v(w, "wies")} · Projekt nr ${v(w, "nr")}</p>
        <h2>${v(w, "tytul_uchway")}</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "tresc")}</p></div>
      `),
  },
  {
    id: "wniosek-fundusz-sołecki",
    kategoria: "Fundusz sołecki i finanse",
    tytul: "Wniosek o sfinansowanie zadania z funduszu sołeckiego (szablon)",
    opis: "Ramowy wniosek — treść dostosuj do uchwały gminy o FS.",
    pola: [
      { id: "wnioskodawca", etykieta: "Wnioskodawca (np. sołectwo / KGW)", typ: "text" },
      { id: "gmina", etykieta: "Gmina", typ: "text" },
      { id: "kwota", etykieta: "Wnioskowana kwota (PLN)", typ: "text", placeholder: "np. 5 000,00" },
      { id: "nazwa_zadania", etykieta: "Nazwa zadania", typ: "text", placeholder: "np. remont podłogi w świetlicy" },
      {
        id: "uzasadnienie",
        etykieta: "Uzasadnienie i opis",
        typ: "textarea",
        wiersze: 8,
        placeholder: "Potrzeby mieszkańców, zgodność z uchwałą o FS…",
        szybkieWstawki: [
          {
            etykieta: "Szablon krótki",
            wartosc:
              "Zadanie odpowiada potrzebom mieszkańców i wynika z wykazu zadań przyjętego w trybie uchwały o funduszu sołeckim. Wnioskowana kwota zostanie rozliczona zgodnie z przepisami i uchwałą gminy.",
          },
          {
            etykieta: "Załączniki",
            wartosc:
              "Załączniki: kosztorys uproszczony, zdjęcia przed realizacją (do uzupełnienia), oświadczenie o niezaleganiu z ZUS (jeśli wymagane).",
          },
        ],
      },
      {
        id: "harmonogram",
        etykieta: "Termin realizacji / harmonogram",
        typ: "textarea",
        wiersze: 4,
        placeholder: "np. realizacja: maj–wrzesień…",
        szybkieWstawki: [
          {
            etykieta: "Sezon letni",
            wartosc:
              "Realizacja: maj–wrzesień bieżącego roku.\nOdbiór techniczny i rozliczenie kosztów: do 31 października bieżącego roku.",
          },
        ],
      },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Wniosek o sfinansowanie zadania z funduszu sołeckiego", meta, `
        <p><strong>Do:</strong> Wójta / Burmistrza Gminy ${v(w, "gmina")}</p>
        <p><strong>Wnioskodawca:</strong> ${v(w, "wnioskodawca")}</p>
        <h2>Przedmiot wniosku</h2>
        <p>Wnoszę o przyznanie środków z funduszu sołeckiego w wysokości <strong>${v(w, "kwota")} zł</strong> na zadanie: <strong>${v(w, "nazwa_zadania")}</strong>.</p>
        <h2>Uzasadnienie</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "uzasadnienie")}</p></div>
        <h2>Termin realizacji</h2><p style="white-space:pre-wrap">${v(w, "harmonogram")}</p>
      `),
  },
  {
    id: "zawiadomienie-fundusz-termin",
    kategoria: "Fundusz sołecki i finanse",
    tytul: "Zawiadomienie o terminie składania wniosków (fundusz sołecki)",
    opis: "Informacja dla mieszkańców o terminie i zasadach.",
    pola: [
      { id: "wies", etykieta: "Sołectwo", typ: "text" },
      { id: "termin_od", etykieta: "Składanie wniosków od", typ: "text" },
      { id: "termin_do", etykieta: "Składanie wniosków do", typ: "text" },
      { id: "miejsce", etykieta: "Miejsce składania", typ: "text", placeholder: "sołtys / skrzynka …" },
      {
        id: "dodatkowe",
        etykieta: "Dodatkowe informacje",
        typ: "textarea",
        wiersze: 4,
        placeholder: "Wzór wniosku, godziny przyjmowania…",
        szybkieWstawki: [
          {
            etykieta: "Wzór + BIP",
            wartosc:
              "Wzór wniosku dostępny jest w Biuletynie Informacji Publicznej gminy oraz u sołtysa. Wypełnione wnioski z załącznikami należy składać w godzinach … (do uzupełnienia).",
          },
        ],
      },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Zawiadomienie", meta, `
        <p>Zawiadamiam mieszkańców sołectwa <strong>${v(w, "wies")}</strong>, że w okresie od <strong>${v(w, "termin_od")}</strong> do <strong>${v(w, "termin_do")}</strong> przyjmowane są wnioski o środki z funduszu sołeckiego.</p>
        <p><strong>Miejsce:</strong> ${v(w, "miejsce")}</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "dodatkowe")}</p></div>
      `),
  },
  {
    id: "rozliczenie-zbiorki",
    kategoria: "Fundusz sołecki i finanse",
    tytul: "Proste rozliczenie zbiórki / darowizn",
    opis: "Tabela wpływów i suma — do uzupełnienia.",
    pola: [
      { id: "cel", etykieta: "Cel zbiórki", typ: "text" },
      { id: "organizator", etykieta: "Organizator", typ: "text" },
      { id: "kwota_cel", etykieta: "Suma zebrana / cel (PLN)", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Rozliczenie zbiórki", meta, `
        <p><strong>Cel:</strong> ${v(w, "cel")}<br/><strong>Organizator:</strong> ${v(w, "organizator")}<br/><strong>Suma / status:</strong> ${v(w, "kwota_cel")}</p>
        <p>Poniżej: tabela wpływów (uzupełnić ręcznie lub w arkuszu po skopiowaniu).</p>
        <table style="width:100%;border-collapse:collapse"><thead><tr><th style="border:1px solid #78716c;padding:6px">Lp.</th><th style="border:1px solid #78716c;padding:6px">Data</th><th style="border:1px solid #78716c;padding:6px">Kwota</th><th style="border:1px solid #78716c;padding:6px">Uwagi</th></tr></thead>
        <tbody>${Array.from({ length: 15 }, (_, i) => `<tr><td style="border:1px solid #ccc;padding:6px">${i + 1}</td><td style="border:1px solid #ccc;padding:6px"></td><td style="border:1px solid #ccc;padding:6px"></td><td style="border:1px solid #ccc;padding:6px"></td></tr>`).join("")}</tbody></table>
      `),
  },
  {
    id: "pismo-do-gminy",
    kategoria: "Pisma urzędowe",
    tytul: "Pismo do wójta / burmistrza / zarządu gminy",
    opis: "Neutralny blankiet pisma z adresatem i treścią.",
    pola: [
      { id: "adresat", etykieta: "Adresat (pełna nazwa jednostki)", typ: "textarea", wiersze: 2 },
      { id: "z_naglowka", etykieta: "Znak sprawy (z nagłówka sołectwa)", typ: "text", placeholder: "np. SW.1/2026" },
      { id: "dotyczy", etykieta: "Dotyczy", typ: "text", placeholder: "np. wniosek o dofinansowanie …" },
      {
        id: "tresc",
        etykieta: "Treść pisma",
        typ: "textarea",
        wiersze: 12,
        placeholder: "Szanowni Państwo, …",
        szybkieWstawki: [
          {
            etykieta: "Wstęp + prośba",
            wartosc:
              "W związku z prowadzoną sprawą zwracam się z prośbą o:\n1) …\n2) …\n\nJednocześnie informuję, że w razie potrzeby jestem do dyspozycji w celu ustaleń telefonicznych lub osobistego spotkania.",
          },
        ],
      },
      { id: "podpis", etykieta: "Podpis (funkcja, imię i nazwisko)", typ: "text", placeholder: "Sołtys …" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Pismo", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p class="mono">Znak: ${v(w, "z_naglowka")}</p>
        <p><strong>Dotyczy:</strong> ${v(w, "dotyczy")}</p>
        <p>Szanowni Państwo,</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "tresc")}</p></div>
        <p class="podpis">Z poważaniem —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "potwierdzenie-przyjecia-pisma",
    kategoria: "Pisma urzędowe",
    tytul: "Potwierdzenie przyjęcia pisma / wniosku (potwierdzenie wpływu)",
    opis: "Krótka informacja zwrotna dla mieszkańca lub instytucji — data wpływu, sposób rozpatrzenia.",
    pola: [
      { id: "adresat", etykieta: "Adresat (do kogo)", typ: "textarea", wiersze: 2 },
      { id: "wies", etykieta: "Sołectwo / dotyczy", typ: "text" },
      { id: "nr_wplywu", etykieta: "Numer ewidencyjny / skrzynki (opcjonalnie)", typ: "text", placeholder: "np. 12/2026" },
      { id: "data_wplywu", etykieta: "Data wpływu", typ: "date" },
      { id: "czego_dotyczy", etykieta: "Czego dotyczyło pismo (skrót)", typ: "text", placeholder: "np. wniosek o fundusz sołecki" },
      { id: "dalsze_kroki", etykieta: "Dalsze czynności / termin odpowiedzi", typ: "textarea", wiersze: 4, placeholder: "np. rozpatrzenie do … / przekazano do gminy …" },
      { id: "podpis", etykieta: "Potwierdza (funkcja, imię i nazwisko)", typ: "text", placeholder: "Sołtys …" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Potwierdzenie przyjęcia pisma", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p><strong>Dotyczy sołectwa / sprawy:</strong> ${v(w, "wies")}</p>
        <p class="mono">${(w.nr_wplywu ?? "").trim() ? `Nr / znak wpływu: ${e((w.nr_wplywu ?? "").trim())}<br/>` : ""}<strong>Data wpływu:</strong> ${v(w, "data_wplywu")}</p>
        <p>niniejszym potwierdzam przyjęcie pisma w przedmiocie: <strong>${v(w, "czego_dotyczy")}</strong>.</p>
        <h2>Dalsze postępowanie</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "dalsze_kroki")}</p></div>
        <p class="podpis">Z poważaniem —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "pismo-drogowa-usterka",
    kategoria: "Pisma urzędowe",
    tytul: "Zgłoszenie usterek drogi / zjazdu",
    opis: "Do zarządcy drogi lub gminy — opis miejsca i zagrożenia.",
    pola: [
      { id: "droga", etykieta: "Oznaczenie drogi / odcinka", typ: "text" },
      { id: "lokalizacja", etykieta: "Opis miejsca (km, przysiółek, GPS)", typ: "textarea", wiersze: 3 },
      { id: "usterka", etykieta: "Opis usterki", typ: "textarea", wiersze: 5 },
      { id: "zagrozenie", etykieta: "Zagrożenie (np. ruch, dzieci)", typ: "textarea", wiersze: 3 },
      { id: "wnioskodawca", etykieta: "Zgłaszający (sołectwo / osoba)", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Zgłoszenie usterek drogowych", meta, `
        <p><strong>Zgłaszający:</strong> ${v(w, "wnioskodawca")}</p>
        <h2>Przedmiot zgłoszenia</h2>
        <p><strong>Droga / odcinek:</strong> ${v(w, "droga")}</p>
        <p><strong>Lokalizacja:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "lokalizacja")}</p></div>
        <p><strong>Opis usterki:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "usterka")}</p></div>
        <p><strong>Zagrożenie:</strong></p><p style="white-space:pre-wrap">${v(w, "zagrozenie")}</p>
        <p>Wnoszę o podjęcie czynności zgodnie z właściwością i przepisami.</p>
      `),
  },
  {
    id: "wniosek-informacja-publiczna",
    kategoria: "Pisma urzędowe",
    tytul: "Wniosek o udostępnienie informacji publicznej",
    opis: "Szkic wniosku wg ustawy o dostępie do informacji publicznej — dopasuj do praktyki urzędu.",
    pola: [
      { id: "adresat", etykieta: "Adresat (BIP / urząd)", typ: "textarea", wiersze: 2 },
      { id: "wnioskodawca", etykieta: "Wnioskodawca", typ: "textarea", wiersze: 2 },
      { id: "zakres", etykieta: "Zakres żądanej informacji", typ: "textarea", wiersze: 6 },
      { id: "formaa", etykieta: "Preferowana forma (np. kopia elektroniczna)", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Wniosek o udostępnienie informacji publicznej", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p><strong>Wnioskodawca:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "wnioskodawca")}</p></div>
        <h2>Żądanie</h2>
        <p>Na podstawie art. 10 ustawy z dnia 6 września 2001 r. o dostępie do informacji publicznej wnoszę o udostępnienie następującej informacji publicznej:</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "zakres")}</p></div>
        <p><strong>Preferowana forma udostępnienia:</strong> ${v(w, "formaa")}</p>
      `),
  },
  {
    id: "protokol-sali-swietlica",
    kategoria: "Świetlica i majątek",
    tytul: "Protokół odbioru / zdania sali (świetlica)",
    opis: "Stan techniczny, wyposażenie, uwagi stron.",
    pola: [
      { id: "obiekt", etykieta: "Nazwa obiektu / sali", typ: "text" },
      { id: "wynajmujacy", etykieta: "Wynajmujący / użytkownik", typ: "text" },
      { id: "data_od", etykieta: "Od (data godz.)", typ: "text" },
      { id: "data_do", etykieta: "Do (data godz.)", typ: "text" },
      { id: "stan", etykieta: "Stan zdawany / uwagi", typ: "textarea", wiersze: 8 },
      { id: "reprezentant", etykieta: "Z ramienia sołectwa / zarządcy", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Protokół zdania / odbioru sali", meta, `
        <p><strong>Obiekt:</strong> ${v(w, "obiekt")}</p>
        <p><strong>Użytkownik:</strong> ${v(w, "wynajmujacy")} · <strong>Okres:</strong> ${v(w, "data_od")} – ${v(w, "data_do")}</p>
        <h2>Stan techniczny i uwagi</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "stan")}</p></div>
        <p><strong>Osoba przyjmująca protokół (sołtys / zarządca):</strong> ${v(w, "reprezentant")}</p>
      `),
  },
  {
    id: "zgłoszenie-szkody-majatku",
    kategoria: "Świetlica i majątek",
    tytul: "Zgłoszenie szkody w mieniu sołeckim / gminnym",
    opis: "Notatka do ubezpieczyciela lub zarządcy — szkielet.",
    pola: [
      { id: "miejsce", etykieta: "Miejsce zdarzenia", typ: "text" },
      { id: "data", etykieta: "Data i okoliczności", typ: "textarea", wiersze: 4 },
      { id: "opis", etykieta: "Opis szkody", typ: "textarea", wiersze: 6 },
      { id: "swiadkowie", etykieta: "Świadkowie / załączniki", typ: "textarea", wiersze: 3 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Zgłoszenie szkody", meta, `
        <p><strong>Miejsce:</strong> ${v(w, "miejsce")}</p>
        <h2>Okoliczności</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "data")}</p></div>
        <h2>Opis szkody</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "opis")}</p></div>
        <h2>Świadkowie / załączniki</h2><p style="white-space:pre-wrap">${v(w, "swiadkowie")}</p>
      `),
  },
  {
    id: "pelnomocnictwo-ogolne",
    kategoria: "Pełnomocnictwa",
    tytul: "Pełnomocnictwo ogólne (ramowe)",
    opis: "Ogólne upoważnienie — zakres dopisać precyzyjnie z prawnikiem jeśli potrzeba.",
    pola: [
      { id: "udzielajacy", etykieta: "Ja, (imię, nazwisko, PESEL opcjonalnie)", typ: "textarea", wiersze: 2 },
      { id: "pelnomocnik", etykieta: "Upoważniam Pana/Panią", typ: "text" },
      { id: "zakres", etykieta: "Zakres czynności", typ: "textarea", wiersze: 5 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Pełnomocnictwo", meta, `
        <p style="white-space:pre-wrap">${v(w, "udzielajacy")}</p>
        <p>niniejszym upoważniam Pana/Panią <strong>${v(w, "pelnomocnik")}</strong> do dokonywania w moim imieniu następujących czynności:</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "zakres")}</p></div>
        <p class="ramka"><strong>Pełnomocnictwo zwykłe</strong> — w razie potrzeby zawierania umów w imieniu młodoletnich lub dotyczących nieruchomości stosuj przepisy Kodeksu cywilnego (np. forma pisemna z podpisem notarialnie potwierdzonym).</p>
      `),
  },
  {
    id: "oswiadczenie-konflikt-interesow",
    kategoria: "Formalności",
    tytul: "Oświadczenie o braku konfliktu interesów",
    opis: "Wzór do uchwał i komisji — pola do personalizacji.",
    pola: [
      { id: "oswiadczajacy", etykieta: "Ja, niżej podpisany(a)", typ: "text" },
      { id: "funkcja", etykieta: "Funkcja / udział w pracach", typ: "text" },
      { id: "sprawa", etykieta: "Sprawa (np. numer uchwały / przetargu)", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Oświadczenie", meta, `
        <p>Ja, <strong>${v(w, "oswiadczajacy")}</strong>, pełniąc funkcję / uczestnicząc w: <strong>${v(w, "funkcja")}</strong>, oświadczam, że nie pozostaję w konflikcie interesów w rozumieniu przepisów dotyczących jawności życia publicznego w sprawie: <strong>${v(w, "sprawa")}</strong>.</p>
        <p>Oświadczam, że podane informacje są zgodne z prawdą i świadomy odpowiedzialności karnej za składanie fałszywych oświadczeń potwierdzam ich prawdziwość.</p>
      `),
  },
  {
    id: "klauzula-informacyjna-rodo",
    kategoria: "Formalności",
    tytul: "Klauzula informacyjna RODO (krótki szablon)",
    opis: "Do zbiórek list, wydarzeń — uzupełnij administratora i cele.",
    pola: [
      { id: "administrator", etykieta: "Administrator danych", typ: "textarea", wiersze: 3 },
      { id: "cel", etykieta: "Cel przetwarzania", typ: "textarea", wiersze: 3 },
      { id: "okres", etykieta: "Okres przechowywania", typ: "text", placeholder: "np. do zakończenia sprawy + 3 lata" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Klauzula informacyjna", meta, `
        <h2>Informacja o przetwarzaniu danych osobowych</h2>
        <p><strong>Administrator:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "administrator")}</p></div>
        <p><strong>Cel przetwarzania:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "cel")}</p></div>
        <p><strong>Okres przechowywania:</strong> ${v(w, "okres")}</p>
        <p>Przysługuje Pani/Panu prawo dostępu do treści danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia, wniesienia sprzeciwu oraz prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</p>
      `),
  },
  {
    id: "zapis-narady",
    kategoria: "Zebranie wiejskie",
    tytul: "Zapis z narady / spotkania roboczego",
    opis: "Krótsza forma niż pełny protokół uchwał.",
    pola: [
      { id: "temat", etykieta: "Temat narady", typ: "text" },
      { id: "uczestnicy", etykieta: "Uczestnicy", typ: "textarea", wiersze: 3 },
      { id: "wnioski", etykieta: "Ustalenia i wnioski", typ: "textarea", wiersze: 8 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Zapis z narady", meta, `
        <p><strong>Temat:</strong> ${v(w, "temat")}</p>
        <h2>Uczestnicy</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "uczestnicy")}</p></div>
        <h2>Ustalenia</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "wnioski")}</p></div>
      `),
  },
  {
    id: "pelnomocnictwo-bank",
    kategoria: "Pełnomocnictwa",
    tytul: "Pełnomocnictwo do konta / banku (ramowe)",
    opis: "Bardzo ogólne — banki mają własne formularze; użyj jako szkicu.",
    pola: [
      { id: "udzielajacy", etykieta: "Upoważniający", typ: "textarea", wiersze: 2 },
      { id: "pelnomocnik", etykieta: "Pełnomocnik", typ: "textarea", wiersze: 2 },
      { id: "bank", etykieta: "Nazwa banku / oddział", typ: "text" },
      { id: "zakres", etykieta: "Zakres (np. wgląd w saldo, wypłaty)", typ: "textarea", wiersze: 4 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Pełnomocnictwo bankowe (szkic)", meta, `
        <p class="ramka"><strong>Uwaga:</strong> większość banków wymaga własnego formularza lub formy notarialnej. Ten dokument ma charakter roboczy.</p>
        <p style="white-space:pre-wrap">${v(w, "udzielajacy")}</p>
        <p>upoważnia</p>
        <p style="white-space:pre-wrap">${v(w, "pelnomocnik")}</p>
        <p>do czynności w <strong>${v(w, "bank")}</strong> w zakresie:</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "zakres")}</p></div>
      `),
  },
  {
    id: "umowa-dzielo-szkic",
    kategoria: "Formalności",
    tytul: "Umowa o dzieło / zlecenie (szkic roboczy)",
    opis: "Nie zastępuje porady prawnej — szkiełko stron i wynagrodzenia.",
    pola: [
      { id: "zamawiajacy", etykieta: "Zamawiający", typ: "textarea", wiersze: 2 },
      { id: "wykonawca", etykieta: "Wykonawca", typ: "textarea", wiersze: 2 },
      { id: "przedmiot", etykieta: "Przedmiot umowy (dzieło / usługa)", typ: "textarea", wiersze: 4 },
      { id: "wynagrodzenie", etykieta: "Wynagrodzenie brutto", typ: "text" },
      { id: "termin", etykieta: "Termin wykonania", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Projekt umowy (szkic)", meta, `
        <p class="ramka"><strong>Ważne:</strong> umowy o pracę / ZUS / VAT — skonsultuj z księgową i prawnikiem.</p>
        <p><strong>Zamawiający:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "zamawiajacy")}</p></div>
        <p><strong>Wykonawca:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "wykonawca")}</p></div>
        <h2>Przedmiot</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "przedmiot")}</p></div>
        <p><strong>Wynagrodzenie:</strong> ${v(w, "wynagrodzenie")} · <strong>Termin:</strong> ${v(w, "termin")}</p>
      `),
  },
  {
    id: "decyzja-wewnetrzna-notatka",
    kategoria: "Formalności",
    tytul: "Notatka służbowa / decyzja wewnętrzna (szkic)",
    opis: "Do zapisów zarządu sołeckiego bez formy uchwały.",
    pola: [
      { id: "tytul", etykieta: "Tytuł", typ: "text" },
      { id: "tresc", etykieta: "Treść", typ: "textarea", wiersze: 10 },
      { id: "kierownik", etykieta: "Osoba odpowiedzialna", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Notatka / postanowienie", meta, `
        <h2>${v(w, "tytul")}</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "tresc")}</p></div>
        <p><strong>Odpowiedzialny:</strong> ${v(w, "kierownik")}</p>
      `),
  },
  {
    id: "sprawozdanie-z-dzialalnosci",
    kategoria: "Fundusz sołecki i finanse",
    tytul: "Sprawozdanie z działalności (krótkie)",
    opis: "Do zebrania lub zarządu — okres, działania, wnioski.",
    pola: [
      { id: "okres", etykieta: "Okres sprawozdawczy", typ: "text", placeholder: "np. I półrocze 2026" },
      { id: "jednostka", etykieta: "Jednostka (np. sołectwo, KGW)", typ: "text" },
      { id: "dzialania", etykieta: "Podejmowane działania", typ: "textarea", wiersze: 8 },
      { id: "wnioski", etykieta: "Wnioski na przyszłość", typ: "textarea", wiersze: 4 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Sprawozdanie z działalności", meta, `
        <p><strong>Jednostka:</strong> ${v(w, "jednostka")} · <strong>Okres:</strong> ${v(w, "okres")}</p>
        <h2>Realizacja zadań</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "dzialania")}</p></div>
        <h2>Wnioski</h2><p style="white-space:pre-wrap">${v(w, "wnioski")}</p>
      `),
  },
  {
    id: "zapytanie-ofertowe-proste",
    kategoria: "Pisma urzędowe",
    tytul: "Zapytanie ofertowe / zapytanie o cenę (proste)",
    opis: "Do wykonawców usług remontowych, cateringu itd.",
    pola: [
      { id: "zamawiajacy", etykieta: "Zamawiający", typ: "textarea", wiersze: 2 },
      { id: "przedmiot", etykieta: "Przedmiot zapytania", typ: "textarea", wiersze: 5 },
      { id: "termin_ofert", etykieta: "Termin składania ofert / odpowiedzi", typ: "text" },
      { id: "kontakt", etykieta: "Kontakt zwrotny", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Zapytanie ofertowe", meta, `
        <p style="white-space:pre-wrap">${v(w, "zamawiajacy")}</p>
        <p>zwraca się z prośbą o przedstawienie oferty cenowej / warunków realizacji w zakresie:</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "przedmiot")}</p></div>
        <p><strong>Termin odpowiedzi:</strong> ${v(w, "termin_ofert")}</p>
        <p><strong>Kontakt:</strong> ${v(w, "kontakt")}</p>
      `),
  },
  {
    id: "ogloszenie-wydarzenie-publiczne",
    kategoria: "Komunikacja z mieszkańcami",
    tytul: "Ogłoszenie o wydarzeniu / zebraniu (na tablicę)",
    opis: "Krótki plakatowy tekst do skopiowania na tablicę lub Facebook.",
    pola: [
      { id: "tytul_wyd", etykieta: "Tytuł wydarzenia", typ: "text" },
      { id: "data_miejsce", etykieta: "Data, godzina, miejsce", typ: "textarea", wiersze: 2 },
      { id: "opis", etykieta: "Opis / program", typ: "textarea", wiersze: 5 },
      { id: "kontakt", etykieta: "Kontakt / zapisy", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("OGŁOSZENIE", meta, `
        <p style="text-align:center;font-size:1.15rem;margin-bottom:1rem"><strong>${v(w, "tytul_wyd")}</strong></p>
        <p style="text-align:center">${v(w, "data_miejsce")}</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "opis")}</p></div>
        <p style="text-align:center;margin-top:1rem"><strong>Kontakt:</strong> ${v(w, "kontakt")}</p>
      `),
  },
  {
    id: "protokol-komisji-skret",
    kategoria: "Zebranie wiejskie",
    tytul: "Protokół posiedzenia komisji (skrót)",
    opis: "Dla komisji rewizyjnej, składania wniosków, konkursów.",
    pola: [
      { id: "komisja", etykieta: "Nazwa komisji", typ: "text" },
      { id: "data", etykieta: "Data posiedzenia", typ: "date" },
      { id: "obecni", etykieta: "Obecni członkowie", typ: "textarea", wiersze: 2 },
      { id: "uchwaly", etykieta: "Podjęte ustalenia", typ: "textarea", wiersze: 6 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Protokół posiedzenia komisji", meta, `
        <p><strong>Komisja:</strong> ${v(w, "komisja")} · <strong>Data:</strong> ${v(w, "data")}</p>
        <h2>Obecność</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "obecni")}</p></div>
        <h2>Ustalenia</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "uchwaly")}</p></div>
      `),
  },
  {
    id: "wniosek-dotacja-kultura",
    kategoria: "Pisma urzędowe",
    tytul: "Wniosek / podanie o dotację (kultura, sport, OSP — szkic)",
    opis: "Ramowy wniosek do instytucji lub urzędu — dopasuj załączniki.",
    pola: [
      { id: "adresat", etykieta: "Adresat", typ: "textarea", wiersze: 2 },
      { id: "wnioskodawca", etykieta: "Wnioskodawca", typ: "textarea", wiersze: 2 },
      { id: "kwota", etykieta: "Kwota wnioskowana", typ: "text" },
      { id: "cel", etykieta: "Cel i opis przedsięwzięcia", typ: "textarea", wiersze: 8 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Wniosek o dotację / dofinansowanie", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p><strong>Wnioskodawca:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "wnioskodawca")}</p></div>
        <p>wnosi o przyznanie środków w kwocie <strong>${v(w, "kwota")}</strong> z przeznaczeniem na:</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "cel")}</p></div>
      `),
  },
  {
    id: "porozumienie-strony",
    kategoria: "Formalności",
    tytul: "Porozumienie stron (ugoda robocza)",
    opis: "Szkic dwustronny — do konsultacji prawnej przed podpisem.",
    pola: [
      { id: "strona_a", etykieta: "Strona A", typ: "textarea", wiersze: 2 },
      { id: "strona_b", etykieta: "Strona B", typ: "textarea", wiersze: 2 },
      { id: "przedmiot", etykieta: "Przedmiot porozumienia", typ: "textarea", wiersze: 6 },
      { id: "zobowiazania", etykieta: "Zobowiązania stron", typ: "textarea", wiersze: 5 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Porozumienie stron", meta, `
        <p><strong>Strona A:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "strona_a")}</p></div>
        <p><strong>Strona B:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "strona_b")}</p></div>
        <h2>Przedmiot</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "przedmiot")}</p></div>
        <h2>Zobowiązania</h2><div class="ramka"><p style="white-space:pre-wrap">${v(w, "zobowiazania")}</p></div>
      `),
  },
  {
    id: "pelnomocnictwo-reprezentacja-urzad",
    kategoria: "Pełnomocnictwa",
    tytul: "Pełnomocnictwo do reprezentacji przed urzędem",
    opis: "Skrót do spraw urzędowych — zakres doprecyzuj.",
    pola: [
      { id: "udzielajacy", etykieta: "Ja, (dane pełne)", typ: "textarea", wiersze: 3 },
      { id: "pelnomocnik", etykieta: "Upoważniam", typ: "textarea", wiersze: 2 },
      { id: "urzad", etykieta: "Przed którym urzędem", typ: "text" },
      { id: "sprawa", etykieta: "Sygnatura / opis sprawy", typ: "textarea", wiersze: 3 },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Pełnomocnictwo do reprezentacji", meta, `
        <p style="white-space:pre-wrap">${v(w, "udzielajacy")}</p>
        <p>upoważniam do reprezentowania mnie przed: <strong>${v(w, "urzad")}</strong>, w sprawie:</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "sprawa")}</p></div>
        <p>Pełnomocnictwo obejmuje czynności: składanie wniosków, odbiór pism, wgląd do akt oraz inne czynności niezbędne do prowadzenia sprawy, z wyłączeniem zawarcia ugody i odstąpienia od roszczeń — o ile nie dopiszesz inaczej poniżej.</p>
        <p><strong>Pełnomocnik:</strong></p><div class="ramka"><p style="white-space:pre-wrap">${v(w, "pelnomocnik")}</p></div>
      `),
  },
  {
    id: "zawiadomienie-wprowadzenie-regulaminu",
    kategoria: "Świetlica i majątek",
    tytul: "Zawiadomienie o wprowadzeniu / zmianie regulaminu",
    opis: "Szkic do tablicy ogłoszeń lub skrótu w BIP — dopracuj z prawnikiem w gminie.",
    pola: [
      { id: "wies", etykieta: "Nazwa sołectwa / wsi", typ: "text" },
      { id: "gmina", etykieta: "Gmina", typ: "text" },
      {
        id: "obiekt",
        etykieta: "Czego dotyczy regulamin",
        typ: "text",
        placeholder: "np. świetlica wiejska, plac zabaw, wypożyczenie sprzętu",
      },
      {
        id: "podstawa",
        etykieta: "Podstawa prawna (uchwała / zarządzenie / data głosowania)",
        typ: "textarea",
        wiersze: 3,
        placeholder: "np. Uchwała Rady Gminy nr …, uchwała zebrania sołeckiego …",
      },
      { id: "publikacja", etykieta: "Gdzie można zapoznać się z pełnym tekstem", typ: "textarea", wiersze: 2 },
      { id: "kontakt", etykieta: "Dane do pytań (np. sołtys, godziny)", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Zawiadomienie o wprowadzeniu regulaminu", meta, `
        <p>Sołectwo <strong>${v(w, "wies")}</strong>, <strong>gmina ${v(w, "gmina")}</strong>, zawiadamia, że w dniu wskazanym w odrębnej treści wprowadzono/zmieniono regulamin dotyczący: <strong>${v(w, "obiekt")}</strong>.</p>
        <h2>Podstawa / podjęte rozstrzygnięcia</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "podstawa")}</p></div>
        <h2>Zapoznanie z treścią</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "publikacja")}</p></div>
        <p><strong>Pytania:</strong> ${v(w, "kontakt")}</p>
        <p class="ramka">Treść pełną włącz w panelu wsi w naszawies i na tablicy informacyjnej — w razie wątpliwości skontaktuj się z urzędem gminy.</p>
      `),
  },
  {
    id: "prosba-wsparcie-finansowe-firma",
    kategoria: "Fundraising i sponsorzy",
    tytul: "Prośba o wsparcie finansowe (firma / organizacja)",
    opis: "Gotowe pismo do lokalnej firmy lub fundacji o przekazanie środków.",
    pola: [
      { id: "adresat", etykieta: "Adresat (firma / organizacja)", typ: "textarea", wiersze: 2 },
      { id: "wies", etykieta: "Sołectwo / wieś", typ: "text" },
      { id: "gmina", etykieta: "Gmina", typ: "text" },
      { id: "wnioskodawca", etykieta: "Wnioskodawca", typ: "text", placeholder: "np. Sołectwo ..., rada sołecka" },
      { id: "cel", etykieta: "Cel zbiórki / projektu", typ: "text", placeholder: "np. doposażenie świetlicy wiejskiej" },
      {
        id: "kwota",
        etykieta: "Kwota lub przedział wsparcia",
        typ: "text",
        placeholder: "np. 3 000,00 PLN lub dowolna kwota",
      },
      {
        id: "uzasadnienie",
        etykieta: "Uzasadnienie i wpływ na mieszkańców",
        typ: "textarea",
        wiersze: 8,
        placeholder: "Dlaczego to ważne, ilu mieszkańców skorzysta, co będzie efektem.",
        szybkieWstawki: [
          {
            etykieta: "Wpływ społeczny",
            wartosc:
              "Projekt poprawi warunki spotkań mieszkańców, zajęć dla dzieci i seniorów oraz wydarzeń integracyjnych. Z efektów skorzystają mieszkańcy całego sołectwa, a wsparcie przełoży się na trwałe podniesienie jakości życia lokalnej społeczności.",
          },
        ],
      },
      {
        id: "korzysci",
        etykieta: "Forma podziękowania i promocji sponsora",
        typ: "textarea",
        wiersze: 4,
        placeholder: "np. podziękowanie publiczne, logo na materiałach, informacja na stronie.",
      },
      { id: "kontakt", etykieta: "Kontakt do koordynatora", typ: "text", placeholder: "telefon / e-mail" },
      { id: "podpis", etykieta: "Podpis", typ: "text", placeholder: "Sołtys ..." },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Prośba o wsparcie finansowe", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p><strong>Dotyczy:</strong> wsparcia inicjatywy sołeckiej — ${v(w, "cel")}.</p>
        <p>Szanowni Państwo,</p>
        <p>działając w imieniu <strong>${v(w, "wnioskodawca")}</strong>, sołectwa <strong>${v(w, "wies")}</strong> (gmina ${v(w, "gmina")}), zwracam się z uprzejmą prośbą o wsparcie finansowe realizacji zadania: <strong>${v(w, "cel")}</strong>.</p>
        <p><strong>Oczekiwane wsparcie:</strong> ${v(w, "kwota")}.</p>
        <h2>Uzasadnienie</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "uzasadnienie")}</p></div>
        <h2>Proponowana forma współpracy i podziękowania</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "korzysci")}</p></div>
        <p><strong>Kontakt:</strong> ${v(w, "kontakt")}</p>
        <p class="podpis">Z wyrazami szacunku —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "prosba-wsparcie-rzeczowe-uslugowe",
    kategoria: "Fundraising i sponsorzy",
    tytul: "Prośba o wsparcie rzeczowe / usługowe",
    opis: "Pismo o przekazanie materiałów, sprzętu, usług lub roboczogodzin.",
    pola: [
      { id: "adresat", etykieta: "Adresat (firma / sklep / wykonawca)", typ: "textarea", wiersze: 2 },
      { id: "wies", etykieta: "Sołectwo / wieś", typ: "text" },
      { id: "gmina", etykieta: "Gmina", typ: "text" },
      { id: "cel", etykieta: "Cel przedsięwzięcia", typ: "text", placeholder: "np. odświeżenie sali świetlicy" },
      {
        id: "zakres",
        etykieta: "Zakres potrzebnego wsparcia",
        typ: "textarea",
        wiersze: 7,
        placeholder: "np. farba 120 l, panele 60 m2, transport, montaż.",
      },
      {
        id: "termin",
        etykieta: "Termin realizacji / dostawy",
        typ: "text",
        placeholder: "np. do 20 czerwca 2026 r.",
      },
      {
        id: "rozliczenie",
        etykieta: "Sposób rozliczenia i potwierdzenia przekazania",
        typ: "textarea",
        wiersze: 4,
        placeholder: "np. protokół przekazania, podziękowanie, publikacja informacji o wsparciu.",
      },
      { id: "kontakt", etykieta: "Kontakt", typ: "text" },
      { id: "podpis", etykieta: "Podpis", typ: "text", placeholder: "Sołtys ..." },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Prośba o wsparcie rzeczowe / usługowe", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p>Szanowni Państwo,</p>
        <p>w imieniu mieszkańców sołectwa <strong>${v(w, "wies")}</strong> (gmina ${v(w, "gmina")}) zwracam się z prośbą o wsparcie rzeczowe lub usługowe przedsięwzięcia: <strong>${v(w, "cel")}</strong>.</p>
        <h2>Zakres potrzeb</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "zakres")}</p></div>
        <p><strong>Preferowany termin:</strong> ${v(w, "termin")}</p>
        <h2>Rozliczenie i potwierdzenie</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "rozliczenie")}</p></div>
        <p><strong>Kontakt:</strong> ${v(w, "kontakt")}</p>
        <p class="podpis">Z wyrazami szacunku —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "podziekowanie-za-wsparcie",
    kategoria: "Fundraising i sponsorzy",
    tytul: "Podziękowanie za wsparcie finansowe lub rzeczowe",
    opis: "Eleganckie podziękowanie dla firmy, instytucji lub darczyńcy.",
    pola: [
      { id: "adresat", etykieta: "Adresat podziękowania", typ: "textarea", wiersze: 2 },
      { id: "wies", etykieta: "Sołectwo / wieś", typ: "text" },
      { id: "gmina", etykieta: "Gmina", typ: "text" },
      { id: "projekt", etykieta: "Nazwa projektu / inicjatywy", typ: "text" },
      { id: "wsparcie", etykieta: "Opis otrzymanego wsparcia", typ: "textarea", wiersze: 4 },
      {
        id: "efekt",
        etykieta: "Efekt dla mieszkańców",
        typ: "textarea",
        wiersze: 5,
        placeholder: "Co udało się zrobić dzięki wsparciu.",
      },
      {
        id: "publikacja",
        etykieta: "Informacja o publikacji podziękowania",
        typ: "text",
        placeholder: "np. strona wsi, Facebook, tablica ogłoszeń",
      },
      { id: "podpis", etykieta: "Podpis", typ: "text", placeholder: "Sołtys ..." },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Podziękowanie za okazane wsparcie", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p>Szanowni Państwo,</p>
        <p>w imieniu mieszkańców sołectwa <strong>${v(w, "wies")}</strong> (gmina ${v(w, "gmina")}) składamy serdeczne podziękowania za wsparcie inicjatywy <strong>${v(w, "projekt")}</strong>.</p>
        <p><strong>Otrzymane wsparcie:</strong></p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "wsparcie")}</p></div>
        <h2>Rezultat dla społeczności</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "efekt")}</p></div>
        <p>Informacja o podziękowaniu zostanie opublikowana: <strong>${v(w, "publikacja")}</strong>.</p>
        <p class="podpis">Z wyrazami wdzięczności —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "przypomnienie-o-wsparcie-sponsora",
    kategoria: "Fundraising i sponsorzy",
    tytul: "Przypomnienie o prośbie o wsparcie (sponsor / firma)",
    opis: "Krótkie, uprzejme przypomnienie po pierwszej prośbie — bez nacisku, z datą pierwszego pisma.",
    pola: [
      { id: "adresat", etykieta: "Adresat", typ: "textarea", wiersze: 2 },
      { id: "wies", etykieta: "Sołectwo / wieś", typ: "text" },
      { id: "gmina", etykieta: "Gmina", typ: "text" },
      { id: "cel", etykieta: "Cel wsparcia (jak w pierwszej prośbie)", typ: "text" },
      {
        id: "data_pierwszej_prosby",
        etykieta: "Data pierwszej prośby / wysłania",
        typ: "text",
        placeholder: "np. 3 maja 2026 r.",
      },
      {
        id: "tresc",
        etykieta: "Treść przypomnienia",
        typ: "textarea",
        wiersze: 6,
        placeholder: "Uprzejmie przypominam o naszej prośbie…",
        szybkieWstawki: [
          {
            etykieta: "Gotowiec",
            wartosc:
              "Uprzejmie przypominam o złożonej prośbie o wsparcie inicjatywy sołeckiej. Jeśli jest możliwość krótkiej odpowiedzi (tak/nie lub propozycja innej formy wsparcia), będę wdzięczny/a. W razie pytań pozostaję do dyspozycji.",
          },
        ],
      },
      { id: "kontakt", etykieta: "Kontakt zwrotny", typ: "text" },
      { id: "podpis", etykieta: "Podpis", typ: "text", placeholder: "Sołtys ..." },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Przypomnienie", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p>Szanowni Państwo,</p>
        <p>w imieniu sołectwa <strong>${v(w, "wies")}</strong> (gmina ${v(w, "gmina")}) uprzejmie przypominam o złożonej prośbie o wsparcie przedsięwzięcia: <strong>${v(w, "cel")}</strong>.</p>
        <p><strong>Pierwsza prośba / wysłanie:</strong> ${v(w, "data_pierwszej_prosby")}</p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "tresc")}</p></div>
        <p><strong>Kontakt:</strong> ${v(w, "kontakt")}</p>
        <p class="podpis">Z wyrazami szacunku —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "potwierdzenie-wplywu-srodkow-finansowych",
    kategoria: "Fundraising i sponsorzy",
    tytul: "Potwierdzenie wpływu środków finansowych od sponsora",
    opis: "Notatka potwierdzająca otrzymanie przelewu lub wpłaty — do archiwum i podziękowania.",
    pola: [
      { id: "darczyca", etykieta: "Darczyńca / firma", typ: "textarea", wiersze: 2 },
      { id: "odbiorca", etykieta: "Odbiorca (sołectwo / rachunek)", typ: "textarea", wiersze: 2 },
      { id: "data_wplywu", etykieta: "Data wpływu", typ: "date" },
      { id: "kwota", etykieta: "Kwota (PLN)", typ: "text", placeholder: "np. 3 000,00" },
      {
        id: "nr_operacji",
        etykieta: "Nr przelewu / tytuł przelewu (opcjonalnie)",
        typ: "text",
        placeholder: "do uzupełnienia z wyciągu",
      },
      { id: "cel", etykieta: "Przeznaczenie środków", typ: "text" },
      { id: "uwagi", etykieta: "Uwagi", typ: "textarea", wiersze: 2 },
      { id: "podpis", etykieta: "Potwierdza (sołtys / osoba upoważniona)", typ: "text" },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Potwierdzenie wpływu środków", meta, `
        <p><strong>Darczyńca:</strong></p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "darczyca")}</p></div>
        <p><strong>Odbiorca:</strong></p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "odbiorca")}</p></div>
        <p><strong>Data wpływu:</strong> ${v(w, "data_wplywu")} · <strong>Kwota:</strong> ${v(w, "kwota")} zł</p>
        <p><strong>Dane operacji:</strong> ${v(w, "nr_operacji")}</p>
        <p><strong>Przeznaczenie:</strong> ${v(w, "cel")}</p>
        <p><strong>Uwagi:</strong></p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "uwagi")}</p></div>
        <p class="podpis">Potwierdzam wpływ środków —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "potwierdzenie-darowizny-rzeczowej",
    kategoria: "Fundraising i sponsorzy",
    tytul: "Potwierdzenie odbioru darowizny / wsparcia rzeczowego",
    opis: "Dokument do podpisania po przekazaniu wsparcia przez firmę lub osobę.",
    pola: [
      { id: "darczyca", etykieta: "Darczyńca (nazwa / dane)", typ: "textarea", wiersze: 2 },
      { id: "odbiorca", etykieta: "Odbiorca (sołectwo / jednostka)", typ: "textarea", wiersze: 2 },
      { id: "data", etykieta: "Data przekazania", typ: "date" },
      {
        id: "przedmiot",
        etykieta: "Przedmiot darowizny / wsparcia",
        typ: "textarea",
        wiersze: 6,
        placeholder: "Wyszczególnienie ilości, stanu, wartości orientacyjnej.",
      },
      { id: "cel", etykieta: "Cel wykorzystania", typ: "text" },
      { id: "uwagi", etykieta: "Uwagi dodatkowe", typ: "textarea", wiersze: 3 },
      { id: "podpis", etykieta: "Podpis odbiorcy (sołtys)", typ: "text", placeholder: "Sołtys ..." },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Potwierdzenie odbioru darowizny", meta, `
        <p><strong>Darczyńca:</strong></p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "darczyca")}</p></div>
        <p><strong>Odbiorca:</strong></p>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "odbiorca")}</p></div>
        <p><strong>Data przekazania:</strong> ${v(w, "data")}</p>
        <h2>Przedmiot przekazania</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "przedmiot")}</p></div>
        <p><strong>Cel wykorzystania:</strong> ${v(w, "cel")}</p>
        <p><strong>Uwagi:</strong> ${v(w, "uwagi")}</p>
        <p class="podpis">Potwierdzam odbiór —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "plan-pracy-kgw-roczny",
    kategoria: "KGW i organizacje",
    tytul: "Plan pracy KGW na rok (szablon)",
    opis: "Roczny plan działań, warsztatów, wyjazdów i odpowiedzialności.",
    pola: [
      { id: "nazwa_kgw", etykieta: "Nazwa KGW / organizacji", typ: "text", placeholder: "np. KGW Złote Kłosy" },
      { id: "wies", etykieta: "Wieś / sołectwo", typ: "text" },
      { id: "rok_plan", etykieta: "Rok planu", typ: "text", domyslna: String(new Date().getFullYear()) },
      { id: "cele", etykieta: "Cele na rok", typ: "textarea", wiersze: 6 },
      { id: "harmonogram", etykieta: "Harmonogram działań", typ: "textarea", wiersze: 10 },
      { id: "budzet", etykieta: "Źródła finansowania i budżet", typ: "textarea", wiersze: 5 },
      { id: "podpis", etykieta: "Podpis (przewodnicząca / zarząd)", typ: "text", placeholder: "Przewodnicząca KGW ..." },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Plan pracy KGW", meta, `
        <p><strong>Organizacja:</strong> ${v(w, "nazwa_kgw")} · <strong>Wieś:</strong> ${v(w, "wies")} · <strong>Rok:</strong> ${v(w, "rok_plan")}</p>
        <h2>Cele i priorytety</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "cele")}</p></div>
        <h2>Harmonogram</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "harmonogram")}</p></div>
        <h2>Budżet i źródła finansowania</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "budzet")}</p></div>
        <p class="podpis">Zatwierdzono przez zarząd —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "wniosek-kgw-mikrodotacja",
    kategoria: "KGW i organizacje",
    tytul: "Wniosek KGW o mikrodotację / wsparcie wydarzenia",
    opis: "Szkic pod nabory gminne i lokalne granty dla KGW.",
    pola: [
      { id: "adresat", etykieta: "Adresat naboru / grantodawca", typ: "textarea", wiersze: 2 },
      { id: "nazwa_kgw", etykieta: "Nazwa KGW", typ: "text" },
      { id: "wies", etykieta: "Wieś / sołectwo", typ: "text" },
      { id: "tytul_projektu", etykieta: "Tytuł projektu", typ: "text", placeholder: "np. Tradycja i integracja pokoleń" },
      { id: "kwota", etykieta: "Kwota wnioskowana", typ: "text", placeholder: "np. 4 500,00 PLN" },
      { id: "opis", etykieta: "Opis projektu", typ: "textarea", wiersze: 8 },
      { id: "rezultaty", etykieta: "Rezultaty i grupa odbiorców", typ: "textarea", wiersze: 5 },
      { id: "podpis", etykieta: "Podpis", typ: "text", placeholder: "Przewodnicząca KGW ..." },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Wniosek KGW o dofinansowanie", meta, `
        <p style="white-space:pre-wrap">${v(w, "adresat")}</p>
        <p><strong>Wnioskodawca:</strong> ${v(w, "nazwa_kgw")} · <strong>Sołectwo:</strong> ${v(w, "wies")}</p>
        <p><strong>Tytuł projektu:</strong> ${v(w, "tytul_projektu")} · <strong>Kwota:</strong> ${v(w, "kwota")}</p>
        <h2>Opis projektu</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "opis")}</p></div>
        <h2>Rezultaty i odbiorcy</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "rezultaty")}</p></div>
        <p class="podpis">Z wyrazami szacunku —<br/><strong>${v(w, "podpis")}</strong></p>
      `),
  },
  {
    id: "komunikat-osp-bezpieczenstwo",
    kategoria: "KGW i organizacje",
    tytul: "Komunikat OSP / bezpieczeństwo mieszkańców",
    opis: "Szybki komunikat dla mieszkańców o ćwiczeniach, utrudnieniach i zasadach bezpieczeństwa.",
    pola: [
      { id: "jednostka", etykieta: "Jednostka", typ: "text", placeholder: "np. OSP Studzienki" },
      { id: "temat", etykieta: "Temat komunikatu", typ: "text", placeholder: "np. Ćwiczenia OSP i czasowe utrudnienia" },
      { id: "data_miejsce", etykieta: "Data / miejsce", typ: "textarea", wiersze: 2 },
      { id: "tresc", etykieta: "Treść komunikatu", typ: "textarea", wiersze: 7 },
      { id: "zalecenia", etykieta: "Zalecenia dla mieszkańców", typ: "textarea", wiersze: 5 },
      { id: "kontakt", etykieta: "Kontakt", typ: "text", placeholder: "np. OSP tel. ..., sołtys tel. ..." },
    ],
    budujHtml: (w, meta) =>
      otoczenie("Komunikat bezpieczeństwa", meta, `
        <p><strong>Jednostka:</strong> ${v(w, "jednostka")}</p>
        <p style="text-align:center;font-size:1.05rem"><strong>${v(w, "temat")}</strong></p>
        <p><strong>Data / miejsce:</strong><br/>${v(w, "data_miejsce")}</p>
        <h2>Informacja</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "tresc")}</p></div>
        <h2>Zalecenia dla mieszkańców</h2>
        <div class="ramka"><p style="white-space:pre-wrap">${v(w, "zalecenia")}</p></div>
        <p><strong>Kontakt:</strong> ${v(w, "kontakt")}</p>
      `),
  },
];

/** Jedna linia pod tytułem dokumentu (druk / archiwum). */
export function kontekstSolectwaDlaMeta(wies?: string, gmina?: string): string | undefined {
  const w = (wies ?? "").trim();
  const g = (gmina ?? "").trim();
  if (!w && !g) return undefined;
  if (w && g) return `Sołectwo ${w} · gmina ${g}`;
  if (w) return `Sołectwo ${w}`;
  return `Gmina ${g}`;
}

/** Stabilny numer w sesji przeglądarki — do oznaczania wydruków. */
export function wygenerujNumerReferencyjnySoltys(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const suf =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
      : String(Math.random()).slice(2, 10);
  return `NW-SOL-${y}${m}${day}-${suf}`;
}

/**
 * Wypełnia puste pola typowymi danymi z panelu (wies, gmina, sołtys).
 * Nie nadpisuje treści wpisanej ręcznie.
 */
export function uzupelnijDomyslnePresetu(
  preset: PresetDokumentu,
  wartosci: Record<string, string>,
  opcje: OpcjeDomyslneGeneratoraSoltysa
): Record<string, string> {
  const w = { ...wartosci };
  const ids = new Set(preset.pola.map((p) => p.id));
  const wies = (opcje.domyslnaWies ?? "").trim();
  const gmina = (opcje.domyslnaGmina ?? "").trim();
  const soltys = (opcje.domyslnySoltysNazwa ?? "").trim();

  const puste = (id: string) => !((w[id] ?? "").trim());
  const ma = (id: string) => ids.has(id);

  if (wies && ma("wies") && puste("wies")) w.wies = wies;
  if (gmina && ma("gmina") && puste("gmina")) w.gmina = gmina;

  if (soltys) {
    if (ma("podpis") && puste("podpis")) w.podpis = `Sołtys ${soltys}`;
    if (ma("reprezentant") && puste("reprezentant")) w.reprezentant = `Sołtys ${soltys}`;
    if (ma("kierownik") && puste("kierownik")) w.kierownik = soltys;
    if (ma("oswiadczajacy") && puste("oswiadczajacy")) w.oswiadczajacy = soltys;
  }

  if (wies) {
    if (ma("jednostka") && puste("jednostka")) w.jednostka = `Sołectwo ${wies}`;
    const wnioskodawcaSolectwo =
      preset.id === "wniosek-fundusz-sołecki" || preset.id === "pismo-drogowa-usterka";
    if (wnioskodawcaSolectwo && ma("wnioskodawca") && puste("wnioskodawca")) {
      w.wnioskodawca = gmina ? `Sołectwo ${wies}, gmina ${gmina}` : `Sołectwo ${wies}`;
    }
    if (preset.id === "zapytanie-ofertowe-proste" && ma("zamawiajacy") && puste("zamawiajacy")) {
      w.zamawiajacy = gmina ? `Sołectwo ${wies}\ngmina ${gmina}` : `Sołectwo ${wies}`;
    }
  }

  return w;
}

export function znajdzPreset(id: string): PresetDokumentu | undefined {
  return PRESETY_DOKUMENTOW_SOLTYSA.find((p) => p.id === id);
}

export function domyslneWartosciPol(p: PresetDokumentu): Record<string, string> {
  const r: Record<string, string> = {};
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  for (const pole of p.pola) {
    r[pole.id] = pole.domyslna ?? (pole.typ === "date" ? iso : "");
  }
  return r;
}
