import { escapeHtml as e } from "@/lib/tekst/escape-html";
import type { OpcjeDomyslneGeneratoraSoltysa, PresetDokumentu } from "./typy";

function v(r: Record<string, string>, key: string): string {
  const t = (r[key] ?? "").trim();
  return t ? e(t) : "—";
}

function stylDruku(): string {
  return `<style>
    .doc-soltys { font-family: ui-serif, Georgia, "Times New Roman", serif; color: #1c1917; line-height: 1.45; max-width: 720px; margin: 0 auto; }
    .doc-soltys h1 { font-size: 1.35rem; margin: 0 0 0.6rem; text-align: center; border-bottom: 2px solid #14532d; padding-bottom: 0.5rem; }
    .doc-soltys .pas-nadtytul { font-size: 0.72rem; color: #44403c; text-align: center; margin: 0 0 0.75rem; padding: 0.45rem 0.65rem; background: #ecfdf5; border: 1px solid #d6d3d1; border-radius: 6px; line-height: 1.35; }
    .doc-soltys .pas-nadtytul .nr-ref { font-family: ui-monospace, monospace; font-weight: 600; color: #14532d; letter-spacing: 0.03em; }
    .doc-soltys .meta { font-size: 0.8rem; color: #57534e; text-align: center; margin: 0 0 0.35rem; }
    .doc-soltys .meta:last-of-type { margin-bottom: 1.1rem; }
    .doc-soltys h2 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; }
    .doc-soltys p { margin: 0.4rem 0; text-align: justify; }
    .doc-soltys .mono { font-family: ui-monospace, monospace; font-size: 0.85rem; }
    .doc-soltys .podpis { margin-top: 2.5rem; }
    .doc-soltys .ramka { border: 1px solid #d6d3d1; padding: 0.75rem 1rem; margin: 0.75rem 0; border-radius: 4px; background: #fafaf9; }
    .doc-soltys .stopka-tech { font-size: 0.68rem; color: #a8a29e; text-align: center; margin-top: 1.75rem; padding-top: 0.5rem; border-top: 1px solid #e7e5e4; }
    @media print { .no-print { display: none !important; } .doc-soltys { max-width: none; } @page { margin: 14mm; size: A4; } }
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
  return `${stylDruku()}
<div class="doc-soltys">
  ${pasNad}
  <h1>${e(tytul)}</h1>
  <p class="meta">Wygenerowano w naszawies.pl · ${e(meta.dataWygenerowania)}</p>
  ${kto}
  ${stan}
  ${body}
  <p class="podpis"><em>Miejscowość, data i podpisy — uzupełnić odręcznie lub w edytorze tekstu po eksporcie do PDF.</em></p>
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
