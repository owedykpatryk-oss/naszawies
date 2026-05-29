import type { LicznikiOczekujacychSoltysa } from "./liczniki-oczekujacych-soltysa";
import { escapeHtml } from "@/lib/tekst/escape-html";

export type WierszRaportuKolejki = {
  typ: string;
  tytul: string;
  wies: string;
  data: string;
};

/** HTML do eksportu PDF (podsumowanie panelu sołtysa). */
export function zbudujHtmlRaportuSoltysa(opts: {
  data: string;
  liczniki: LicznikiOczekujacychSoltysa;
  kolejka: WierszRaportuKolejki[];
  nazwyWsi?: string[];
}): string {
  const { data, liczniki: l, kolejka, nazwyWsi = [] } = opts;
  const wierszeKpi = [
    ["Wnioski o role", l.wnioski],
    ["Rezerwacje sal", l.rezerwacje],
    ["Zgłoszenia (otwarte)", l.zgloszenia],
    ["Posty do moderacji", l.posty],
    ["Wiadomości lokalne", l.wiadomosci],
    ["Rynek lokalny", l.rynek],
    ["Pomoc sąsiedzka", l.pomoc],
    ["Zdjęcia (fotokronika)", l.zdjecia],
    ["Raporty treści", l.raportySpolecznosci],
  ];

  const tabelaKpi = wierszeKpi
    .map(
      ([nazwa, n]) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #e7e5e4">${escapeHtml(String(nazwa))}</td><td style="padding:6px 8px;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:600">${n}</td></tr>`,
    )
    .join("");

  const tabelaKolejka =
    kolejka.length === 0
      ? '<p style="color:#78716c;font-size:13px">Brak pozycji w kolejce.</p>'
      : `<table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#f5f5f4">
        <th style="padding:6px 8px;text-align:left">Typ</th>
        <th style="padding:6px 8px;text-align:left">Tytuł</th>
        <th style="padding:6px 8px;text-align:left">Wieś</th>
        <th style="padding:6px 8px;text-align:left">Data</th>
      </tr></thead>
      <tbody>${kolejka
        .map(
          (p) =>
            `<tr>
              <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4">${escapeHtml(p.typ)}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4">${escapeHtml(p.tytul)}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4">${escapeHtml(p.wies)}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4">${escapeHtml(p.data)}</td>
            </tr>`,
        )
        .join("")}</tbody></table>`;

  return `
    <div style="font-family:Georgia,'Times New Roman',serif;color:#1c1917;padding:8px 4px;max-width:720px">
      <p style="font-size:11px;color:#57534e;margin:0 0 4px">naszawies.pl · panel sołtysa</p>
      <h1 style="font-size:20px;margin:0 0 8px;color:#14532d">Podsumowanie pracy — ${escapeHtml(data)}</h1>
      ${nazwyWsi.length ? `<p style="font-size:12px;color:#57534e;margin:0 0 16px">Wsie: ${escapeHtml(nazwyWsi.join(", "))}</p>` : ""}
      <h2 style="font-size:14px;margin:16px 0 8px;color:#14532d">Licznik oczekujących</h2>
      <table style="width:100%;max-width:400px;border-collapse:collapse;font-size:13px">${tabelaKpi}</table>
      <h2 style="font-size:14px;margin:20px 0 8px;color:#14532d">Kolejka pracy (skrót)</h2>
      ${tabelaKolejka}
      <p style="font-size:10px;color:#a8a29e;margin-top:24px">Wygenerowano w panelu sołtysa. Dokument roboczy — nie zastępuje protokołów urzędowych.</p>
    </div>
  `;
}
