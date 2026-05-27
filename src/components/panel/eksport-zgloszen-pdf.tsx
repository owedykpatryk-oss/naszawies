"use client";

import { useMemo } from "react";
import { etykietaStanuZgloszenia, kategorieZgloszen } from "@/lib/zgloszenia/szybkie-etykiety";
import { EksportHtmlPdfKlient } from "./eksport-html-pdf-klient";

type Wiersz = {
  title: string;
  wies_nazwa: string;
  category: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  description: string;
};

function etykietKat(c: string) {
  return kategorieZgloszen.find((x) => x.value === c)?.label ?? c;
}

export function EksportZgloszenPdf({ wiersze, tytulRaportu = "Zgłoszenia mieszkańców" }: { wiersze: Wiersz[]; tytulRaportu?: string }) {
  const html = useMemo(() => {
    const data = new Date().toLocaleString("pl-PL");
    const rows =
      wiersze.length === 0
        ? '<tr><td colspan="5" style="padding:8px;color:#78716c">Brak zgłoszeń w raporcie.</td></tr>'
        : wiersze
            .map(
              (r) => `<tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4;vertical-align:top">${r.is_urgent ? "⚠ " : ""}${r.title}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4">${r.wies_nazwa}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4">${etykietKat(r.category)}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4">${etykietaStanuZgloszenia(r.status)}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #e7e5e4;font-size:11px">${new Date(r.created_at).toLocaleString("pl-PL")}</td>
              </tr>`,
            )
            .join("");

    return `
      <div style="font-family:Georgia,serif;color:#1c1917;padding:8px">
        <h1 style="font-size:18px;color:#14532d;margin:0 0 4px">${tytulRaportu}</h1>
        <p style="font-size:11px;color:#57534e;margin:0 0 16px">Wygenerowano: ${data} · Liczba: ${wiersze.length}</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f5f5f4">
            <th style="padding:6px 8px;text-align:left">Tytuł</th>
            <th style="padding:6px 8px;text-align:left">Wieś</th>
            <th style="padding:6px 8px;text-align:left">Kategoria</th>
            <th style="padding:6px 8px;text-align:left">Status</th>
            <th style="padding:6px 8px;text-align:left">Data</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:10px;color:#a8a29e;margin-top:16px">Dane wrażliwe — tylko do użytku sołtysa. Pełne opisy i zdjęcia w panelu online.</p>
      </div>
    `;
  }, [wiersze, tytulRaportu]);

  if (wiersze.length === 0) return null;

  return (
    <EksportHtmlPdfKlient
      html={html}
      nazwaPliku={`zgloszenia-${new Date().toISOString().slice(0, 10)}`}
      etykietaPrzycisku="Eksport listy do PDF"
    />
  );
}
