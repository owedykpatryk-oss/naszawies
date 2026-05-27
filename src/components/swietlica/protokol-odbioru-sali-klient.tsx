"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { zapiszProtokolOdbioruSali } from "@/app/(site)/panel/soltys/akcje";
import {
  DECYZJE_KAUCJI,
  ETYKIETY_DECYZJI_KAUCJI,
  ETYKIETY_STANU_POZYCJI,
  STANY_POZYCJI_ODBIORU,
  STANY_PORZADKU_SALI,
  czyTerminMinnal,
  parsujProtokolOdbioru,
  type ProtokolOdbioruSali,
  type StanPozycjiOdbioru,
} from "@/lib/swietlica/protokol-odbioru";

export type PozycjaDoOdbioru = {
  inventoryId: string;
  nazwa: string;
  zamowiono: number;
};

type Props = {
  bookingId: string;
  hallId: string;
  status: string;
  endAtIso: string;
  pozycjePoczatkowe: PozycjaDoOdbioru[];
  checkoutInspectionRaw: unknown;
};

export function ProtokolOdbioruSaliKlient({
  bookingId,
  hallId,
  status,
  endAtIso,
  pozycjePoczatkowe,
  checkoutInspectionRaw,
}: Props) {
  const router = useRouter();
  const zapisany = useMemo(() => parsujProtokolOdbioru(checkoutInspectionRaw), [checkoutInspectionRaw]);
  const [otwarty, ustawOtwarty] = useState(false);
  const [salaPorzadek, ustawSalaPorzadek] = useState<(typeof STANY_PORZADKU_SALI)[number]>("ok");
  const [kaucjaZwrot, ustawKaucjaZwrot] = useState<(typeof DECYZJE_KAUCJI)[number]>("nie_dotyczy");
  const [uszkodzenia, ustawUszkodzenia] = useState(false);
  const [uwagi, ustawUwagi] = useState("");
  const [pozycje, ustawPozycje] = useState(() =>
    pozycjePoczatkowe.map((p) => ({
      ...p,
      zwrocono: p.zamowiono,
      stan: "ok" as StanPozycjiOdbioru,
      uwaga: "",
    }))
  );
  const [blad, ustawBlad] = useState("");
  const [oczekuje, startTransition] = useTransition();

  if (status === "completed" && zapisany) {
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50/50 p-4">
        <p className="text-sm font-medium text-green-950">Protokół odbioru sali — zapisany</p>
        <p className="mt-1 text-xs text-stone-600">
          {new Date(zapisany.wykonanoAt).toLocaleString("pl-PL")} · {zapisany.wykonanoPrzez}
        </p>
        <ul className="mt-2 space-y-1 text-xs text-stone-700">
          <li>
            Porządek sali:{" "}
            {zapisany.salaPorzadek === "ok"
              ? "OK"
              : zapisany.salaPorzadek === "do_sprzatania"
                ? "Wymaga sprzątania"
                : "Poważny problem"}
          </li>
          <li>Kaucja: {ETYKIETY_DECYZJI_KAUCJI[zapisany.kaucjaZwrot]}</li>
          {zapisany.pozycje.length > 0 ? (
            <li>
              Asortyment:{" "}
              {zapisany.pozycje.filter((x) => x.stan !== "ok").length === 0
                ? "wszystko OK"
                : `${zapisany.pozycje.filter((x) => x.stan !== "ok").length} uwag`}
            </li>
          ) : null}
        </ul>
        {zapisany.uwagiOgolne ? (
          <p className="mt-2 whitespace-pre-wrap text-xs text-stone-700">{zapisany.uwagiOgolne}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => drukujProtokol(zapisany, bookingId)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-50"
          >
            Drukuj protokół
          </button>
          <Link
            href={`/panel/soltys/swietlica/${hallId}/dokument?rezerwacja=${bookingId}`}
            className="rounded-lg border border-green-800/30 bg-white px-3 py-1.5 text-xs text-green-900 hover:bg-green-50"
          >
            Dokument rezerwacji
          </Link>
        </div>
      </div>
    );
  }

  if (status !== "approved") {
    return null;
  }

  if (!czyTerminMinnal(endAtIso)) {
    return (
      <p className="mt-2 text-xs text-stone-500">
        Po zakończeniu terminu ({new Date(endAtIso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })})
        pojawi się formularz odbioru sali z weryfikacją asortymentu.
      </p>
    );
  }

  function ustawStan(idx: number, stan: StanPozycjiOdbioru) {
    ustawPozycje((prev) => prev.map((p, i) => (i === idx ? { ...p, stan } : p)));
  }

  function zapisz() {
    ustawBlad("");
    startTransition(async () => {
      const w = await zapiszProtokolOdbioruSali({
        bookingId,
        salaPorzadek,
        pozycje: pozycje.map((p) => ({
          inventoryId: p.inventoryId,
          nazwa: p.nazwa,
          zamowiono: p.zamowiono,
          zwrocono: p.zwrocono,
          stan: p.stan,
          uwaga: p.uwaga.trim() || null,
        })),
        uwagiOgolne: uwagi.trim() || null,
        kaucjaZwrot,
        uszkodzeniaPotwierdzone: uszkodzenia,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOtwarty(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-amber-950">Wymagany odbiór sali</p>
          <p className="mt-0.5 text-xs text-amber-900/90">
            Termin minął — sprawdź stan sali i zamówiony asortyment, potem zapisz protokół (rezerwacja przejdzie na
            „zakończona”).
          </p>
        </div>
        {!otwarty ? (
          <button
            type="button"
            onClick={() => ustawOtwarty(true)}
            className="rounded-lg bg-amber-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-900"
          >
            Rozpocznij odbiór
          </button>
        ) : null}
      </div>

      {otwarty ? (
        <div className="mt-4 space-y-4 border-t border-amber-200/80 pt-4">
          <fieldset>
            <legend className="text-xs font-medium text-stone-700">Stan sali po wydarzeniu</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {STANY_PORZADKU_SALI.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-1.5 text-xs">
                  <input
                    type="radio"
                    name={`porzadek-${bookingId}`}
                    checked={salaPorzadek === s}
                    onChange={() => ustawSalaPorzadek(s)}
                  />
                  {s === "ok" ? "Porządek OK" : s === "do_sprzatania" ? "Do sprzątania" : "Poważny problem"}
                </label>
              ))}
            </div>
          </fieldset>

          {pozycje.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-stone-700">Weryfikacja zamówionego asortymentu</p>
              <ul className="mt-2 space-y-2">
                {pozycje.map((p, idx) => (
                  <li key={p.inventoryId} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs">
                    <p className="font-medium text-stone-900">
                      {p.nazwa} — zamówiono: {p.zamowiono} szt.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-stone-600">
                        Zwrócono:
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={p.zwrocono}
                          onChange={(e) =>
                            ustawPozycje((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, zwrocono: Number(e.target.value) || 0 } : x
                              )
                            )
                          }
                          className="ml-1 w-14 rounded border border-stone-300 px-1 py-0.5"
                        />
                      </label>
                      <select
                        value={p.stan}
                        onChange={(e) => ustawStan(idx, e.target.value as StanPozycjiOdbioru)}
                        className="rounded border border-stone-300 px-2 py-0.5"
                      >
                        {STANY_POZYCJI_ODBIORU.map((s) => (
                          <option key={s} value={s}>
                            {ETYKIETY_STANU_POZYCJI[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-stone-600">Brak zamówionego asortymentu — sprawdź ogólny stan sali i wyposażenia.</p>
          )}

          <fieldset>
            <legend className="text-xs font-medium text-stone-700">Decyzja o kaucji</legend>
            <select
              value={kaucjaZwrot}
              onChange={(e) => ustawKaucjaZwrot(e.target.value as (typeof DECYZJE_KAUCJI)[number])}
              className="mt-1 w-full max-w-xs rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            >
              {DECYZJE_KAUCJI.map((d) => (
                <option key={d} value={d}>
                  {ETYKIETY_DECYZJI_KAUCJI[d]}
                </option>
              ))}
            </select>
          </fieldset>

          <label className="flex items-center gap-2 text-xs text-stone-700">
            <input type="checkbox" checked={uszkodzenia} onChange={(e) => ustawUszkodzenia(e.target.checked)} />
            Potwierdzam uszkodzenia / braki wymagające rozliczenia
          </label>

          <div>
            <label htmlFor={`uwagi-odbior-${bookingId}`} className="text-xs font-medium text-stone-700">
              Uwagi do protokołu
            </label>
            <textarea
              id={`uwagi-odbior-${bookingId}`}
              rows={3}
              value={uwagi}
              onChange={(e) => ustawUwagi(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              placeholder="Np. drobne zabrudzenie podłogi, brak 2 krzeseł…"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={oczekuje}
              onClick={zapisz}
              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
            >
              {oczekuje ? "Zapisywanie…" : "Zapisz protokół i zakończ rezerwację"}
            </button>
            <button
              type="button"
              disabled={oczekuje}
              onClick={() => ustawOtwarty(false)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700"
            >
              Anuluj
            </button>
          </div>
          {blad ? (
            <p className="text-xs text-red-800" role="alert">
              {blad}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function drukujProtokol(protokol: ProtokolOdbioruSali, bookingId: string) {
  const pozycjeHtml =
    protokol.pozycje.length > 0
      ? `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px">
      <tr><th>Pozycja</th><th>Zam.</th><th>Zwr.</th><th>Stan</th></tr>
      ${protokol.pozycje
        .map(
          (p) =>
            `<tr><td>${p.nazwa}</td><td>${p.zamowiono}</td><td>${p.zwrocono}</td><td>${ETYKIETY_STANU_POZYCJI[p.stan]}</td></tr>`
        )
        .join("")}
    </table>`
      : "<p>Brak pozycji asortymentu do weryfikacji.</p>";

  const html = `<html><head><meta charset="utf-8"/><title>Protokół odbioru sali</title>
  <style>body{font-family:Georgia,serif;padding:24px;line-height:1.5;color:#1c1917} h1{font-size:20px} .meta{color:#57534e;font-size:13px}</style>
  </head><body>
  <h1>Protokół odbioru / zdania sali świetlicy</h1>
  <p class="meta">Rezerwacja: ${bookingId.slice(0, 8)}… · ${new Date(protokol.wykonanoAt).toLocaleString("pl-PL")}</p>
  <p><strong>Wykonał:</strong> ${protokol.wykonanoPrzez}</p>
  <p><strong>Stan sali:</strong> ${
    protokol.salaPorzadek === "ok" ? "Porządek OK" : protokol.salaPorzadek === "do_sprzatania" ? "Do sprzątania" : "Poważny problem"
  }</p>
  <p><strong>Kaucja:</strong> ${ETYKIETY_DECYZJI_KAUCJI[protokol.kaucjaZwrot]}</p>
  <h2>Asortyment</h2>${pozycjeHtml}
  ${protokol.uwagiOgolne ? `<h2>Uwagi</h2><p style="white-space:pre-wrap">${protokol.uwagiOgolne}</p>` : ""}
  <p style="margin-top:40px">Podpis odbierającego (sołtys): _________________________</p>
  <p>Podpis wynajmującego: _________________________</p>
  </body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
