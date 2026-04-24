"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PrzyciskPobierzPdf } from "@/components/dokumenty/przycisk-pobierz-pdf";
import {
  PRESETY_DOKUMENTOW_SOLTYSA,
  domyslneWartosciPol,
  kontekstSolectwaDlaMeta,
  uzupelnijDomyslnePresetu,
  wygenerujNumerReferencyjnySoltys,
  znajdzPreset,
} from "@/lib/dokumenty-soltysa/presety";
import { zbudujSugestieKontekstowe } from "@/lib/dokumenty-soltysa/sugestie-kontekstowe";
import type { PresetDokumentu } from "@/lib/dokumenty-soltysa/typy";

type Props = {
  /** Pierwsza wieś sołtysa — wstawiana w pole „wies” / „sołectwo”, jeśli puste */
  domyslnaWies?: string;
  domyslnaGmina?: string;
  /** Z profilu — podpis, potwierdzenia, meta „kto wygenerował” */
  domyslnySoltysNazwa?: string;
};

function pogrupujPresety(lista: PresetDokumentu[]) {
  const map = new Map<string, PresetDokumentu[]>();
  for (const p of lista) {
    const arr = map.get(p.kategoria) ?? [];
    arr.push(p);
    map.set(p.kategoria, arr);
  }
  return Array.from(map.entries());
}

/** Małe litery + usunięcie znaków diakrytycznych — wygodne szukanie po polsku. */
function znormalizujDoSzukania(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function presetPasujeDoFiltra(p: PresetDokumentu, frazaSurowa: string): boolean {
  const f = znormalizujDoSzukania(frazaSurowa);
  if (!f) return true;
  const paczka = [p.tytul, p.opis, p.kategoria, p.id.replace(/-/g, " ")].join(" ");
  return znormalizujDoSzukania(paczka).includes(f);
}

export function GeneratorDokumentowSoltysaKlient({
  domyslnaWies = "",
  domyslnaGmina = "",
  domyslnySoltysNazwa = "",
}: Props) {
  const pierwszy = PRESETY_DOKUMENTOW_SOLTYSA[0];
  const [presetId, ustawPresetId] = useState(pierwszy?.id ?? "");
  const [filtrSzukaj, ustawFiltrSzukaj] = useState("");
  const [numerReferencyjnySesji, ustawNumerReferencyjnySesji] = useState(() =>
    wygenerujNumerReferencyjnySoltys(),
  );

  const opcjeDomyslne = useMemo(
    () => ({
      domyslnaWies,
      domyslnaGmina,
      domyslnySoltysNazwa,
    }),
    [domyslnaWies, domyslnaGmina, domyslnySoltysNazwa],
  );

  const presetyPoFiltze = useMemo(
    () => PRESETY_DOKUMENTOW_SOLTYSA.filter((p) => presetPasujeDoFiltra(p, filtrSzukaj)),
    [filtrSzukaj],
  );

  const preset = znajdzPreset(presetId) ?? pierwszy;

  const [wartosci, ustawWartosci] = useState<Record<string, string>>(() => {
    if (!pierwszy) return {};
    const w = domyslneWartosciPol(pierwszy);
    if (domyslnaWies) w.wies = w.wies || domyslnaWies;
    if (domyslnaGmina) w.gmina = w.gmina || domyslnaGmina;
    return uzupelnijDomyslnePresetu(pierwszy, w, {
      domyslnaWies,
      domyslnaGmina,
      domyslnySoltysNazwa,
    });
  });

  const zmienPreset = useCallback(
    (id: string) => {
      ustawPresetId(id);
      const p = znajdzPreset(id);
      if (!p) return;
      const w = domyslneWartosciPol(p);
      if (domyslnaWies && p.pola.some((x) => x.id === "wies")) w.wies = w.wies || domyslnaWies;
      if (domyslnaGmina && p.pola.some((x) => x.id === "gmina")) w.gmina = w.gmina || domyslnaGmina;
      ustawWartosci(uzupelnijDomyslnePresetu(p, w, opcjeDomyslne));
    },
    [domyslnaWies, domyslnaGmina, opcjeDomyslne],
  );

  useEffect(() => {
    if (presetyPoFiltze.length === 0) return;
    if (presetyPoFiltze.some((p) => p.id === presetId)) return;
    zmienPreset(presetyPoFiltze[0].id);
  }, [presetyPoFiltze, presetId, zmienPreset]);

  const metaDokumentu = useMemo(() => {
    const d = new Date();
    return {
      dataWygenerowania: d.toLocaleString("pl-PL", {
        dateStyle: "long",
        timeStyle: "short",
      }),
      stanNaDzien: d.toLocaleDateString("pl-PL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      numerReferencyjny: numerReferencyjnySesji,
      kontekstSolectwa: kontekstSolectwaDlaMeta(domyslnaWies, domyslnaGmina),
      wygenerowalNazwa: domyslnySoltysNazwa.trim() || undefined,
    };
  }, [domyslnaWies, domyslnaGmina, domyslnySoltysNazwa, numerReferencyjnySesji]);

  const htmlPodglad = useMemo(() => {
    if (!preset) return "";
    return preset.budujHtml(wartosci, metaDokumentu);
  }, [preset, wartosci, metaDokumentu]);

  const nazwaPlikuPdf = useMemo(() => {
    if (!preset) return "naszawies-soltys.pdf";
    const slug = preset.id.replace(/[^a-z0-9-]/gi, "_");
    const d = new Date().toISOString().slice(0, 10);
    const nr = numerReferencyjnySesji.replace(/[^\w-]+/g, "") || "ref";
    return `naszawies-soltys_${slug}_${nr}_${d}.pdf`;
  }, [preset, numerReferencyjnySesji]);

  const wyczyscPolaPresetu = useCallback(() => {
    if (!preset) return;
    const w = domyslneWartosciPol(preset);
    if (domyslnaWies && preset.pola.some((x) => x.id === "wies")) w.wies = domyslnaWies;
    if (domyslnaGmina && preset.pola.some((x) => x.id === "gmina")) w.gmina = domyslnaGmina;
    ustawWartosci(uzupelnijDomyslnePresetu(preset, w, opcjeDomyslne));
  }, [preset, domyslnaWies, domyslnaGmina, opcjeDomyslne]);

  const wstawDoPola = useCallback((poleId: string, fragment: string, dopisz: boolean) => {
    ustawWartosci((prev) => {
      const cur = (prev[poleId] ?? "").trim();
      if (dopisz && cur.length > 0) {
        return { ...prev, [poleId]: `${cur}\n\n${fragment}` };
      }
      return { ...prev, [poleId]: fragment };
    });
  }, []);

  const wartosciDlaSugestii = useMemo(
    () => ({
      ...wartosci,
      gmina: (wartosci.gmina ?? "").trim() || domyslnaGmina,
      wies: (wartosci.wies ?? "").trim() || domyslnaWies,
      podpis: (wartosci.podpis ?? "").trim() || domyslnySoltysNazwa,
    }),
    [wartosci, domyslnaGmina, domyslnaWies, domyslnySoltysNazwa],
  );

  const sugestieGrup = useMemo(() => {
    const p = znajdzPreset(presetId) ?? pierwszy;
    if (!p || presetyPoFiltze.length === 0) return [];
    return zbudujSugestieKontekstowe(p, wartosciDlaSugestii, {
      domyslnaWies,
      domyslnaGmina,
      domyslnySoltysNazwa,
    });
  }, [
    presetId,
    pierwszy,
    presetyPoFiltze,
    wartosciDlaSugestii,
    domyslnaWies,
    domyslnaGmina,
    domyslnySoltysNazwa,
  ]);

  if (!preset) {
    return <p className="text-sm text-stone-600">Brak presetów dokumentów.</p>;
  }

  const grupy = pogrupujPresety(presetyPoFiltze);
  const calkowita = PRESETY_DOKUMENTOW_SOLTYSA.length;
  const poFiltrze = presetyPoFiltze.length;

  return (
    <div className="space-y-8">
      <div className="no-print rounded-2xl border border-stone-200 bg-amber-50/40 p-4 text-sm leading-snug text-amber-950">
        Dokumenty są <strong>szablonami informacyjnymi</strong> — nie stanowią porady prawnej. Przed wysłaniem do
        urzędu lub banku dopasuj treść do przepisów i uchwał w Twojej gminie.{" "}
        <strong>Na telefonie</strong> użyj „Pobierz PDF” (zapis pliku); „Drukuj / PDF z systemu” otwiera menu
        drukowania przeglądarki — tam często jest „Zapisz jako PDF”.
      </div>

      <div className="no-print grid gap-6 pb-[max(1rem,env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-8">
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100dvh-5rem)] lg:overflow-hidden lg:flex lg:flex-col">
          <h2 className="font-serif text-lg text-green-950">Wybierz dokument</h2>
          <label htmlFor="soltys-dok-szukaj" className="sr-only">
            Szukaj w szablonach dokumentów
          </label>
          <input
            id="soltys-dok-szukaj"
            type="search"
            value={filtrSzukaj}
            onChange={(e) => ustawFiltrSzukaj(e.target.value)}
            placeholder="Szukaj: zebranie, fundusz, świetlica…"
            autoComplete="off"
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-green-800/20 placeholder:text-stone-400 focus:border-green-700 focus:ring-2"
          />
          <p className="text-xs text-stone-500">
            {filtrSzukaj.trim() ? (
              <>
                Znaleziono <strong className="text-stone-800">{poFiltrze}</strong> z {calkowita} szablonów
                {poFiltrze === 0 ? " — wyczyść filtr lub zmień frazę." : "."}
              </>
            ) : (
              <>Dostępnych szablonów: {calkowita}. Wyszukiwanie ignoruje polskie znaki (ą → a).</>
            )}
          </p>
          <nav
            className="max-h-[min(50vh,28rem)] flex-1 space-y-5 overflow-y-auto overscroll-y-contain pr-1 text-sm [-webkit-overflow-scrolling:touch] lg:max-h-none lg:min-h-0"
            aria-label="Presety dokumentów"
          >
            {poFiltrze === 0 ? (
              <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                Brak szablonów pasujących do „{filtrSzukaj.trim()}”.
              </p>
            ) : (
              grupy.map(([kat, items]) => (
                <div key={kat}>
                  <p className="mb-2 font-medium text-stone-800">{kat}</p>
                  <ul className="space-y-1 border-l-2 border-green-900/15 pl-3">
                    {items.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => zmienPreset(p.id)}
                          className={`min-h-[44px] w-full touch-manipulation rounded-md px-3 py-2.5 text-left text-[15px] leading-snug transition-colors hover:bg-stone-100 active:bg-stone-200 sm:min-h-0 sm:py-1.5 sm:text-sm ${
                            p.id === presetId ? "bg-green-900/10 font-medium text-green-950" : "text-stone-700"
                          }`}
                        >
                          {p.tytul}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          {poFiltrze === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-6 text-sm text-amber-950">
              <p className="font-medium">Żaden szablon nie pasuje do wyszukiwania.</p>
              <p className="mt-2 text-stone-700">
                Wyczyść pole szukania albo wpisz inną frazę (np. „zebranie”, „fundusz”, „pelnomocnictwo”).
              </p>
            </div>
          ) : (
            <>
          <div>
            <h2 className="font-serif text-xl text-green-950">{preset.tytul}</h2>
            <p className="mt-1 text-sm text-stone-600">{preset.opis}</p>
            <p className="mt-2 font-mono text-[11px] text-stone-500">
              Nr ref. sesji: <span className="text-green-900">{numerReferencyjnySesji}</span>
            </p>
          </div>

          {sugestieGrup.length > 0 ? (
            <div
              className="no-print rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/40 p-4 shadow-sm"
              role="region"
              aria-label="Sugestie treści do dokumentu"
            >
              <h3 className="font-serif text-base text-green-950">Sugestie</h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                Gotowe fragmenty wg typu dokumentu i pól (wies, gmina) — <strong>bez sztucznej inteligencji</strong>, reguły
                z naszawies.pl. Zawsze dopasuj treść do uchwał i BIP przed wysłaniem.
              </p>
              <div className="mt-3 space-y-4">
                {sugestieGrup.map((g) => (
                  <div key={g.grupa}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/90">{g.grupa}</p>
                    {g.opis ? <p className="mt-0.5 text-[11px] text-stone-500">{g.opis}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.sugestie.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          title={`Wstaw do: ${s.poleDocelowe}`}
                          onClick={() =>
                            wstawDoPola(s.poleDocelowe, s.wartosc, Boolean(s.preferujDopisanie))
                          }
                          className="rounded-full border border-green-900/20 bg-white/90 px-2.5 py-1 text-left text-xs font-medium text-green-950 shadow-sm transition hover:border-green-800/40 hover:bg-emerald-50 active:scale-[0.98]"
                        >
                          {s.etykieta}
                          <span className="ml-1 font-normal text-stone-500">→ {s.poleDocelowe}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            {preset.pola.map((pole) => (
              <div key={pole.id}>
                <label className="block text-xs font-medium text-stone-600" htmlFor={`pole-${pole.id}`}>
                  {pole.etykieta}
                </label>
                {pole.typ === "textarea" ? (
                  <textarea
                    id={`pole-${pole.id}`}
                    value={wartosci[pole.id] ?? ""}
                    onChange={(e) => ustawWartosci((prev) => ({ ...prev, [pole.id]: e.target.value }))}
                    rows={pole.wiersze ?? 4}
                    placeholder={pole.placeholder}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                  />
                ) : (
                  <input
                    id={`pole-${pole.id}`}
                    type={pole.typ === "date" ? "date" : "text"}
                    value={wartosci[pole.id] ?? ""}
                    onChange={(e) => ustawWartosci((prev) => ({ ...prev, [pole.id]: e.target.value }))}
                    placeholder={pole.placeholder}
                    className="mt-1 w-full min-h-[48px] rounded-lg border border-stone-300 px-3 py-2.5 text-base sm:min-h-0 sm:py-2 sm:text-sm"
                  />
                )}
                {pole.podpowiedz ? (
                  <p className="mt-0.5 text-[11px] text-stone-500">{pole.podpowiedz}</p>
                ) : null}
                {pole.szybkieWstawki && pole.szybkieWstawki.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`Szybkie wstawki: ${pole.etykieta}`}>
                    {pole.szybkieWstawki.map((sw) => {
                      const cur = (wartosci[pole.id] ?? "").trim();
                      const dopisz = pole.typ === "textarea" && cur.length > 0;
                      return (
                        <button
                          key={`${pole.id}-${sw.etykieta}`}
                          type="button"
                          onClick={() => wstawDoPola(pole.id, sw.wartosc, dopisz)}
                          className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-800 transition hover:border-green-800/30 hover:bg-emerald-50/80 active:scale-[0.98]"
                        >
                          {sw.etykieta}
                          {dopisz ? (
                            <span className="ml-1 font-normal text-stone-500">(dopisz)</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-start">
              <PrzyciskPobierzPdf
                elementId="soltys-generator-dokument-html"
                nazwaPliku={nazwaPlikuPdf}
                className="sm:shrink-0"
              />
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[48px] w-full touch-manipulation rounded-lg border-2 border-green-900/35 bg-white px-4 py-3 text-base font-medium text-green-950 shadow-sm transition hover:bg-green-50 sm:w-auto sm:min-h-[44px] sm:py-2.5 sm:text-sm"
              >
                Drukuj / PDF z systemu
              </button>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              {(domyslnaWies || domyslnaGmina || domyslnySoltysNazwa) && (
                <button
                  type="button"
                  onClick={() =>
                    ustawWartosci((prev) => uzupelnijDomyslnePresetu(preset, prev, opcjeDomyslne))
                  }
                  className="min-h-[44px] w-full touch-manipulation rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-800 transition hover:bg-stone-50 sm:w-auto sm:text-sm"
                >
                  Wypełnij puste pola z panelu
                </button>
              )}
              <button
                type="button"
                onClick={wyczyscPolaPresetu}
                className="min-h-[44px] w-full touch-manipulation rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-base text-stone-800 transition hover:bg-stone-100 sm:w-auto sm:text-sm"
              >
                Wyczyść pola tego dokumentu
              </button>
              <button
                type="button"
                onClick={() => ustawNumerReferencyjnySesji(wygenerujNumerReferencyjnySoltys())}
                className="min-h-[44px] w-full touch-manipulation rounded-lg border border-green-800/25 bg-green-50 px-3 py-2.5 text-base font-medium text-green-950 transition hover:bg-green-100 sm:w-auto sm:text-sm"
              >
                Nowy numer referencyjny
              </button>
            </div>
            <p className="text-sm leading-snug text-stone-500 sm:flex-1 sm:text-xs">
              Podgląd poniżej — przy druku ukrywane są formularz i menu panelu. Numer ref. w PDF i podglądzie
              aktualizuje się po „Nowy numer…” lub odświeżeniu strony (nowa sesja).
            </p>
          </div>
            </>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-white via-stone-50/40 to-stone-100/30 p-3 shadow-[0_12px_40px_-24px_rgba(20,83,45,0.18)] sm:p-5 print:border-0 print:bg-white print:p-0 print:shadow-none">
        <p className="no-print mb-2 flex items-center gap-2 text-xs font-medium text-stone-600 sm:mb-3">
          <span
            className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
            aria-hidden
          />
          Podgląd / wydruk
        </p>
        {poFiltrze === 0 ? (
          <p className="text-sm text-stone-500">Wybierz szablon z listy po lewej — podgląd pojawi się tutaj.</p>
        ) : (
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-lg border border-stone-200/80 bg-white print:overflow-visible print:border-0">
            {/*
              PDF: html2canvas + element z overflow:auto często daje pustą stronę — id tylko na wewnętrznym bloku.
            */}
            <div
              id="soltys-generator-dokument-html"
              className="min-w-0 px-2 py-3 sm:px-4 sm:py-5 print:p-0"
              dangerouslySetInnerHTML={{ __html: htmlPodglad }}
            />
          </div>
        )}
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; }
            #soltys-generator-dokument-html { box-shadow: none !important; }
          }
        `,
        }}
      />
    </div>
  );
}
