"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { rozpocznijCzatZOgloszenia } from "@/app/(site)/panel/czat/akcje";
import { linkSms, linkWhatsApp, tekstWiadomosciDoSprzedawcy } from "@/lib/marketplace/kontakt-sprzedawcy";
import { RynekInfoKontaktMiedzyLudzmi } from "@/components/wies/rynek-info-kontakt-miedzy-ludzmi";

type Props = {
  ogloszenieId: string;
  telefon: string | null;
  tytul: string;
  urlOgloszenia: string;
  sciezkaWsi: string;
  nazwaWsi?: string;
  zalogowany: boolean;
  toJa: boolean;
};

export function RynekKontaktSprzedawcy({
  ogloszenieId,
  telefon,
  tytul,
  urlOgloszenia,
  sciezkaWsi,
  nazwaWsi,
  zalogowany,
  toJa,
}: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  const tekstKontaktu = tekstWiadomosciDoSprzedawcy({ tytul, url: urlOgloszenia, nazwaWsi });
  const whatsapp = telefon ? linkWhatsApp(telefon, tekstKontaktu) : null;
  const sms = telefon ? linkSms(telefon, tekstKontaktu) : null;

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-green-200/60 bg-gradient-to-br from-green-50/80 to-emerald-50/40 p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-green-900">Kontakt ze sprzedawcą</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          Czat w serwisie — dla zalogowanych mieszkańców wsi. Telefon i WhatsApp — gdy sprzedawca poda numer.{" "}
          <strong>Płatności nie ma w serwisie</strong> — umawiacie się między sobą.
        </p>

        {!toJa && zalogowany ? (
          <button
            type="button"
            disabled={czek}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-800 to-green-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-green-900 hover:to-green-950 disabled:opacity-50"
            onClick={() => {
              ustawBlad("");
              startT(async () => {
                const w = await rozpocznijCzatZOgloszenia(ogloszenieId);
                if ("blad" in w) {
                  ustawBlad(w.blad);
                  return;
                }
                if (w.conversationId) router.push(`/panel/czat/${w.conversationId}`);
              });
            }}
          >
            <span aria-hidden>💬</span>
            {czek ? "Otwieranie czatu…" : "Napisz wiadomość w serwisie"}
          </button>
        ) : null}

        {!zalogowany && !toJa ? (
          <Link
            href={`/logowanie?next=${encodeURIComponent(`${sciezkaWsi}/rynek/${ogloszenieId}`)}`}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-800 bg-white px-4 py-3 text-sm font-semibold text-green-900 shadow-sm hover:bg-green-50"
          >
            <span aria-hidden>💬</span>
            Zaloguj się, aby napisać
          </Link>
        ) : null}

        {blad ? (
          <p className="mt-2 text-xs text-red-800" role="alert">
            {blad}
          </p>
        ) : null}
      </div>

      {telefon && !toJa ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <a
            href={`tel:${telefon.replace(/\s/g, "")}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-green-800 px-3 py-2.5 text-sm font-semibold text-white hover:bg-green-900"
          >
            <span aria-hidden>📞</span>
            Zadzwoń
          </a>
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2.5 text-sm font-semibold text-[#128C7E] hover:bg-[#25D366]/20"
            >
              WhatsApp
            </a>
          ) : null}
          {sms ? (
            <a
              href={sms}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              SMS
            </a>
          ) : null}
        </div>
      ) : null}
      <div className="mt-3">
        <RynekInfoKontaktMiedzyLudzmi wariant="kompakt" />
      </div>
    </div>
  );
}

/** Sticky pasek kontaktu na mobile — widoczny przy scrollu szczegółów ogłoszenia. */
export function RynekPasekMobilnyKontakt({
  ogloszenieId,
  telefon,
  tytul,
  urlOgloszenia,
  sciezkaWsi,
  nazwaWsi,
  zalogowany,
  toJa,
}: Props) {
  const router = useRouter();
  const [czek, startT] = useTransition();

  const tekstKontaktu = tekstWiadomosciDoSprzedawcy({ tytul, url: urlOgloszenia, nazwaWsi });
  const whatsapp = telefon ? linkWhatsApp(telefon, tekstKontaktu) : null;

  if (toJa) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/90 bg-white/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg gap-2">
        {zalogowany ? (
          <button
            type="button"
            disabled={czek}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-800 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => {
              startT(async () => {
                const w = await rozpocznijCzatZOgloszenia(ogloszenieId);
                if ("blad" in w) return;
                if (w.conversationId) router.push(`/panel/czat/${w.conversationId}`);
              });
            }}
          >
            💬 Napisz
          </button>
        ) : (
          <Link
            href={`/logowanie?next=${encodeURIComponent(`${sciezkaWsi}/rynek/${ogloszenieId}`)}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-800 px-3 py-2.5 text-sm font-semibold text-white"
          >
            💬 Napisz
          </Link>
        )}
        {telefon ? (
          <a
            href={`tel:${telefon.replace(/\s/g, "")}`}
            className="flex items-center justify-center rounded-xl border border-green-800 px-3 py-2.5 text-sm font-semibold text-green-900"
            aria-label="Zadzwoń"
          >
            📞
          </a>
        ) : null}
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-xl border border-[#25D366]/50 bg-[#25D366]/10 px-3 py-2.5 text-sm font-semibold text-[#128C7E]"
            aria-label="WhatsApp"
          >
            WA
          </a>
        ) : null}
      </div>
    </div>
  );
}
