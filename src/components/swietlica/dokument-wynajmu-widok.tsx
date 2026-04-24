import type { ReactNode } from "react";
import type { DaneDokumentuWynajmu } from "@/lib/swietlica/pobierz-dane-dokumentu-wynajmu";
import { escapeHtml } from "@/lib/tekst/escape-html";
import { PlanSaliRysunek } from "./plan-sali-rysunek";
import { PrzyciskDrukuDokumentu } from "./przycisk-druku-dokumentu";

type Props = {
  dane: DaneDokumentuWynajmu;
};

function pln(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);
}

function Sekcja({
  nr,
  tytul,
  dzieci,
}: {
  nr: string;
  tytul: string;
  dzieci: ReactNode;
}) {
  return (
    <section className="mt-10 scroll-mt-4 print:mt-8">
      <div className="flex min-w-0 items-baseline gap-2 border-b border-green-900/20 pb-2 sm:gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-900 text-xs font-bold text-white print:bg-green-950 sm:h-8 sm:w-8 sm:text-sm">
          {nr}
        </span>
        <h2 className="min-w-0 break-words font-serif text-lg font-normal tracking-tight text-green-950 sm:text-xl print:text-lg">
          {tytul}
        </h2>
      </div>
      <div className="mt-4">{dzieci}</div>
    </section>
  );
}

export function DokumentWynajmuWidok({ dane }: Props) {
  const dataCzasWystawienia = new Date(dane.wygenerowano).toLocaleString("pl-PL", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const dataDnia = new Date(dane.wygenerowano).toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dataKrotkaPodpis = new Date(dane.wygenerowano).toLocaleDateString("pl-PL");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; }
            #dokument-wynajmu-root {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 10mm !important;
              max-width: none !important;
              border: none !important;
            }
            @page { margin: 12mm; size: A4; }
          }
        `,
        }}
      />
      <div
        id="dokument-wynajmu-root"
        className="relative mx-auto max-w-4xl min-w-0 overflow-x-auto overflow-y-visible rounded-2xl border border-stone-200/90 bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_20px_50px_-15px_rgba(21,60,40,0.18)] print:overflow-visible print:shadow-none print:border-0"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-green-900 via-emerald-700 to-green-800 print:h-1"
          aria-hidden
        />
        <div className="min-w-0 p-4 sm:p-10 print:p-0">
          <div className="no-print mb-8">
            <PrzyciskDrukuDokumentu
              elementId="dokument-wynajmu-root"
              nazwaPliku={`wynajem-swietlica-${dane.numerReferencyjny.replace(/[^\w.-]+/g, "_")}.pdf`}
            />
          </div>

          <header className="border-b-2 border-green-900/85 pb-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <p className="font-serif text-2xl font-semibold tracking-tight text-green-950">naszawies.pl</p>
                <h1 className="mt-2 break-words font-serif text-xl font-normal leading-tight tracking-tight text-green-950 sm:max-w-2xl sm:text-2xl sm:text-[1.65rem]">
                  Załącznik informacyjny do wynajmu świetlicy
                </h1>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-stone-600">
                  Dokument zestawia dane z panelu sołtysa i rezerwacji. <strong>Nie zastępuje</strong> umowy
                  cywilnoprawnej — strony mogą sporządzić odrębną umowę najmu lub regulamin wydarzenia.
                </p>
              </div>
              <div className="w-full shrink-0 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/80 px-3 py-3 text-right shadow-sm sm:w-auto sm:px-4 print:border-stone-300 print:bg-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-800/80">Nr ref.</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-green-950 sm:break-normal">
                  {escapeHtml(dane.numerReferencyjny)}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-3 rounded-xl border border-stone-200/80 bg-stone-50/60 p-4 sm:grid-cols-2 print:border print:bg-stone-50">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Wygenerowano (czas lokalny)</dt>
                <dd className="mt-1 text-sm font-medium text-stone-900">{dataCzasWystawienia}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Stan na dzień</dt>
                <dd className="mt-1 text-sm font-medium capitalize text-stone-900">{dataDnia}</dd>
              </div>
            </dl>
          </header>

          <Sekcja
            nr="1"
            tytul="Miejscowość, obiekt i kontakt"
            dzieci={
              <>
              <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:shadow-none">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-900/90">Lokalizacja</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-stone-800">
                <li>
                  <span className="text-stone-500">Sołectwo / wieś:</span>{" "}
                  <strong className="text-stone-900">{escapeHtml(dane.wies)}</strong>
                </li>
                <li>
                  <span className="text-stone-500">Gmina:</span> {escapeHtml(dane.gmina)}
                </li>
                <li>
                  <span className="text-stone-500">Powiat:</span> {escapeHtml(dane.powiat)} ·{" "}
                  <span className="text-stone-500">Woj.:</span> {escapeHtml(dane.wojewodztwo)}
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:shadow-none">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-900/90">Obiekt i kontakt</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-stone-800">
                <li>
                  <span className="text-stone-500">Nazwa sali:</span>{" "}
                  <strong className="text-stone-900">{escapeHtml(dane.sala.nazwa)}</strong>
                </li>
                {dane.sala.adres ? (
                  <li>
                    <span className="text-stone-500">Adres świetlicy:</span>{" "}
                    <strong className="text-stone-900">{escapeHtml(dane.sala.adres)}</strong>
                  </li>
                ) : (
                  <li className="text-amber-800">
                    <span className="text-stone-500">Adres świetlicy:</span> nie uzupełniony w panelu — dopisz przy sali.
                  </li>
                )}
                {dane.sala.telefon ? (
                  <li>
                    <span className="text-stone-500">Telefon:</span>{" "}
                    <a className="text-green-800 underline" href={`tel:${dane.sala.telefon.replace(/\s/g, "")}`}>
                      {escapeHtml(dane.sala.telefon)}
                    </a>
                  </li>
                ) : null}
                {dane.sala.email ? (
                  <li>
                    <span className="text-stone-500">E-mail:</span>{" "}
                    <a className="text-green-800 underline" href={`mailto:${dane.sala.email}`}>
                      {escapeHtml(dane.sala.email)}
                    </a>
                  </li>
                ) : null}
                {dane.sala.opiekunObiektu ? (
                  <li>
                    <span className="text-stone-500">Opiekun / korespondencja (wpis w systemie):</span>{" "}
                    {escapeHtml(dane.sala.opiekunObiektu)}
                  </li>
                ) : null}
                <li className="border-t border-stone-100 pt-2">
                  <span className="text-stone-500">Sołtys wsi (profil naszawies.pl):</span>{" "}
                  <strong className="text-stone-900">
                    {dane.soltysWsiNazwa ? escapeHtml(dane.soltysWsiNazwa) : "— nie przypisano w bazie —"}
                  </strong>
                </li>
              </ul>
            </div>
              </div>
              {(dane.sala.area_m2 != null || dane.sala.max_capacity != null || dane.sala.opis?.trim()) ? (
                <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-4 text-sm text-stone-700">
                  {dane.sala.area_m2 != null ? (
                    <p>
                      <strong>Powierzchnia sali:</strong> {dane.sala.area_m2} m²
                    </p>
                  ) : null}
                  {dane.sala.max_capacity != null ? (
                    <p className={dane.sala.area_m2 != null ? "mt-1" : ""}>
                      <strong>Dopuszczalna liczba osób (wg wpisu):</strong> {dane.sala.max_capacity}
                    </p>
                  ) : null}
                  {dane.sala.opis?.trim() ? (
                    <p className="mt-2 whitespace-pre-wrap border-t border-stone-200/80 pt-2 text-stone-700">
                      {dane.sala.opis}
                    </p>
                  ) : null}
                </div>
              ) : null}
              </>
            }
          />

          <Sekcja
            nr="2"
            tytul="Opłaty i kaucja"
            dzieci={
              <>
                <div className="max-w-full overflow-x-auto rounded-xl border border-stone-200 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                  <table className="w-full min-w-[16rem] table-fixed border-collapse text-sm sm:min-w-0 sm:table-auto">
                    <tbody>
                      <tr className="border-b border-stone-100 bg-stone-50/80">
                        <th className="w-[38%] max-w-[11rem] break-words py-2.5 pl-3 pr-2 text-left text-xs font-semibold text-stone-800 sm:w-2/5 sm:max-w-none sm:py-3 sm:pl-4 sm:pr-3 sm:text-sm">
                          Kaucja
                        </th>
                        <td className="py-2.5 pr-3 font-medium tabular-nums text-stone-900 sm:py-3 sm:pr-4">
                          {pln(dane.kaucjaPln)}
                        </td>
                      </tr>
                      <tr className="border-b border-stone-100">
                        <th className="break-words py-2.5 pl-3 pr-2 text-left text-xs font-semibold text-stone-800 sm:py-3 sm:pl-4 sm:pr-3 sm:text-sm">
                          Stawka — mieszkaniec
                        </th>
                        <td className="py-2.5 pr-3 font-medium tabular-nums text-stone-900 sm:py-3 sm:pr-4">
                          {pln(dane.cenaMieszkaniec)}
                        </td>
                      </tr>
                      <tr className="bg-green-50/40">
                        <th className="break-words py-2.5 pl-3 pr-2 text-left text-xs font-semibold text-stone-800 sm:py-3 sm:pl-4 sm:pr-3 sm:text-sm">
                          Stawka — osoby spoza wsi
                        </th>
                        <td className="py-2.5 pr-3 font-medium tabular-nums text-stone-900 sm:py-3 sm:pr-4">
                          {pln(dane.cenaObcy)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-stone-500">
                  Kwoty według wpisu w systemie. Uchwała rady gminy, zarządzenie lub cennik urzędowy — jeśli istnieją —
                  mają pierwszeństwo przed tym załącznikiem.
                </p>
              </>
            }
          />

          <Sekcja
            nr="3"
            tytul="Regulamin korzystania"
            dzieci={
              <>
                <h3 className="text-sm font-semibold text-stone-800">3.1. Świetlica (sala)</h3>
                {dane.regulamin?.trim() ? (
                  <div className="mt-2 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50/90 p-4 text-sm leading-relaxed text-stone-800">
                    {dane.regulamin}
                  </div>
                ) : (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Brak treści regulaminu sali — uzupełnij w panelu sołtysa przy tej świetlicy.
                  </p>
                )}
                <h3 className="mt-8 text-sm font-semibold text-stone-800">3.2. Plac zabaw (sołectwo)</h3>
                {dane.regulaminPlacuZabaw?.trim() ? (
                  <div className="mt-2 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50/90 p-4 text-sm leading-relaxed text-stone-800">
                    {dane.regulaminPlacuZabaw}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-stone-600">
                    Brak wpisanego regulaminu placu zabaw — sołtys może dodać go w panelu świetlicy (sekcja plac zabaw).
                  </p>
                )}
              </>
            }
          />

          <Sekcja
            nr="4"
            tytul="Wyposażenie (asortyment)"
            dzieci={
              dane.asortyment.length === 0 ? (
                <p className="text-sm text-stone-600">Brak pozycji w katalogu wyposażenia.</p>
              ) : (
                <div className="max-w-full overflow-x-auto rounded-xl border border-stone-200 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                  <table className="w-full min-w-[32rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-green-900/25 bg-green-950/[0.06] text-left text-stone-800">
                        <th className="w-14 py-2.5 pl-2 pr-1 text-[10px] font-bold uppercase tracking-wide sm:w-16 sm:py-3 sm:pl-3 sm:pr-2 sm:text-xs">
                          Zdj.
                        </th>
                        <th className="py-2.5 pr-1 text-[10px] font-bold uppercase tracking-wide sm:py-3 sm:pr-2 sm:text-xs">
                          Kategoria
                        </th>
                        <th className="py-2.5 pr-1 text-[10px] font-bold uppercase tracking-wide sm:py-3 sm:pr-2 sm:text-xs">
                          Nazwa
                        </th>
                        <th className="py-2.5 pr-1 text-[10px] font-bold uppercase tracking-wide sm:py-3 sm:pr-2 sm:text-xs">
                          Ilość
                        </th>
                        <th className="min-w-[7rem] py-2.5 pr-2 text-[10px] font-bold uppercase tracking-wide sm:py-3 sm:pr-3 sm:text-xs">
                          Uwagi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dane.asortyment.map((w, i) => (
                        <tr key={i} className="border-b border-stone-100 odd:bg-white even:bg-stone-50/50">
                          <td className="py-2.5 pl-2 pr-1 align-top sm:pl-3 sm:pr-2">
                            {w.image_url ? (
                              <div className="h-10 w-10 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 sm:h-12 sm:w-12">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={w.image_url} alt="" className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </td>
                          <td className="max-w-[5rem] break-words py-2.5 pr-1 align-top text-xs text-stone-700 sm:max-w-none sm:pr-2 sm:text-sm">
                            {escapeHtml(w.kategoria)}
                          </td>
                          <td className="max-w-[6rem] break-words py-2.5 pr-1 align-top text-xs font-medium text-stone-900 sm:max-w-none sm:pr-2 sm:text-sm">
                            {escapeHtml(w.nazwa)}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-1 align-top tabular-nums sm:pr-2">{w.ilosc}</td>
                          <td className="min-w-0 max-w-[10rem] break-words py-2.5 pr-2 align-top text-xs text-stone-600 sm:max-w-none sm:pr-3 sm:text-sm">
                            {w.opis ? <span className="whitespace-pre-wrap">{escapeHtml(w.opis)}</span> : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          />

          <Sekcja
            nr="5"
            tytul="Schemat ustawienia stołów"
            dzieci={
              dane.plan && dane.plan.elementy.length > 0 ? (
                <div className="max-w-xl rounded-xl border border-stone-200 bg-[#faf8f3] p-4 shadow-inner print:border">
                  <PlanSaliRysunek plan={dane.plan} className="h-56 w-full" />
                </div>
              ) : (
                <p className="text-sm text-stone-600">Brak zapisanego planu sali w systemie.</p>
              )
            }
          />

          <Sekcja
            nr="6"
            tytul="Dokumentacja po wydarzeniach (zgłoszenia)"
            dzieci={
              <>
                {dane.dokumentacjaZniszczen.length === 0 ? (
                  <p className="text-sm text-stone-600">
                    Brak zapisanych zdjęć ani uwag po zakończonych lub zatwierdzonych rezerwacjach.
                  </p>
                ) : (
                  <ul className="space-y-5 text-sm">
                    {dane.dokumentacjaZniszczen.map((w, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4 shadow-sm print:shadow-none"
                      >
                        <p className="font-medium text-stone-900">
                          {new Date(w.start_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} —{" "}
                          {new Date(w.end_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                        <p className="mt-1 text-stone-700">
                          {escapeHtml(w.event_type)}
                          {w.event_title ? ` — ${escapeHtml(w.event_title)}` : ""}
                        </p>
                        <p className="mt-2 text-stone-800">
                          <strong>Uszkodzenia zgłoszone:</strong> {w.was_damaged ? "tak" : "nie"}
                        </p>
                        {w.completion_notes?.trim() ? (
                          <p className="mt-2 whitespace-pre-wrap text-stone-700">{escapeHtml(w.completion_notes)}</p>
                        ) : null}
                        {w.damage_documentation_urls.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {w.damage_documentation_urls.map((url) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="Dokumentacja" className="h-full w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-xs leading-relaxed text-stone-500">
                  Wpisy z panelu rezerwacji (wynajmujący lub sołtys). Nie zastępują protokołu szkody — charakter
                  wyłącznie informacyjny.
                </p>
              </>
            }
          />

          <Sekcja
            nr="7"
            tytul="Potwierdzenia (do uzupełnienia odręcznie)"
            dzieci={
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 print:bg-white">
                  <p className="text-sm font-semibold text-stone-900">Wynajmujący</p>
                  <p className="mt-10 border-b border-stone-400 pb-1 text-sm text-stone-600">Imię i nazwisko / podpis</p>
                  <p className="mt-1 text-xs text-stone-500">Propozycja daty: {dataKrotkaPodpis}</p>
                  <p className="mt-6 border-b border-stone-400 pb-1 text-sm text-stone-600">Data</p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 print:bg-white">
                  <p className="text-sm font-semibold text-stone-900">Z upoważnienia sołectwa / gminy</p>
                  <p className="mt-10 border-b border-stone-400 pb-1 text-sm text-stone-600">
                    Imię i nazwisko / podpis sołtysa lub upoważnionej osoby
                  </p>
                  <p className="mt-1 text-xs text-stone-500">Propozycja daty: {dataKrotkaPodpis}</p>
                  <p className="mt-6 border-b border-stone-400 pb-1 text-sm text-stone-600">Data</p>
                </div>
              </div>
            }
          />

          <footer className="mt-12 border-t border-stone-200 pt-5 text-center text-[11px] leading-relaxed text-stone-500 print:mt-8">
            <p>
              Wygenerowano w serwisie <span className="font-medium text-stone-700">naszawies.pl</span>
              {" · "}
              ref. <span className="font-mono">{escapeHtml(dane.numerReferencyjny)}</span>
            </p>
            <p className="mt-1 font-mono text-[10px] opacity-80">UTC: {escapeHtml(dane.wygenerowano)}</p>
          </footer>
        </div>
      </div>
    </>
  );
}
