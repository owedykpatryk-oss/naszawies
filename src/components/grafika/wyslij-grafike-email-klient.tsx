"use client";

import { useState, useTransition } from "react";
import { bezpiecznaNazwaPlikuPdf, generujPdfBase64ZElementuHtml } from "@/lib/dokumenty/pobierz-pdf-z-elementu";
import { wyslijGrafikeEmail } from "@/app/(site)/panel/grafika/akcje";

type Props = {
  elementId: string;
  domyslnyTemat: string;
  nazwaPliku: string;
};

export function WyslijGrafikeEmailKlient({ elementId, domyslnyTemat, nazwaPliku }: Props) {
  const [email, ustawEmail] = useState("");
  const [temat, ustawTemat] = useState(domyslnyTemat);
  const [wiadomosc, ustawWiadomosc] = useState("W załączeniu przesyłamy zaproszenie / plakat.");
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [oczekuje, startTransition] = useTransition();

  const wyslij = () => {
    ustawBlad(null);
    ustawKomunikat(null);
    const el = document.getElementById(elementId);
    if (!el) {
      ustawBlad("Brak podglądu do wysłania.");
      return;
    }
    startTransition(async () => {
      const pdf = await generujPdfBase64ZElementuHtml(el as HTMLElement);
      if (!pdf.ok) {
        ustawBlad(pdf.komunikat);
        return;
      }
      const r = await wyslijGrafikeEmail({
        do: email.trim(),
        temat: temat.trim() || domyslnyTemat,
        wiadomosc: wiadomosc.trim(),
        pdfBase64: pdf.base64,
        nazwaPliku: bezpiecznaNazwaPlikuPdf(nazwaPliku),
      });
      if ("blad" in r) {
        ustawBlad(r.blad);
        return;
      }
      ustawKomunikat("Wysłano e-mail z załącznikiem PDF.");
    });
  };

  return (
    <div className="no-print rounded-xl border border-sky-200 bg-sky-50/50 p-4 text-sm">
      <h3 className="font-semibold text-sky-950">Wyślij PDF e-mailem (Resend)</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-stone-700">Adres odbiorcy</span>
          <input
            type="email"
            value={email}
            onChange={(e) => ustawEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            placeholder="gosc@example.com"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-stone-700">Temat</span>
          <input
            type="text"
            value={temat}
            onChange={(e) => ustawTemat(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-stone-700">Treść wiadomości</span>
          <textarea
            rows={2}
            value={wiadomosc}
            onChange={(e) => ustawWiadomosc(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={wyslij}
        disabled={oczekuje || !email.trim()}
        className="mt-3 rounded-lg bg-sky-800 px-4 py-2 text-white disabled:opacity-50"
      >
        {oczekuje ? "Wysyłanie…" : "Wyślij zaproszenie e-mailem"}
      </button>
      {komunikat ? <p className="mt-2 text-green-800">{komunikat}</p> : null}
      {blad ? <p className="mt-2 text-red-700">{blad}</p> : null}
    </div>
  );
}
