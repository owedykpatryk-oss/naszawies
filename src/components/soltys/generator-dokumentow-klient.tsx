"use client";

import { useMemo, useRef, useState } from "react";
import { PrzyciskPobierzPdf } from "@/components/dokumenty/przycisk-pobierz-pdf";
import {
  PRESETY_DOKUMENTOW_SOLTYSA,
  domyslneWartosciPol,
  kontekstSolectwaDlaMeta,
  uzupelnijDomyslnePresetu,
  wygenerujNumerReferencyjnySoltys,
  znajdzPreset,
} from "@/lib/dokumenty-soltysa/presety";
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

export function GeneratorDokumentowSoltysaKlient({
  domyslnaWies = "",
  domyslnaGmina = "",
  domyslnySoltysNazwa = "",
}: Props) {
  const pierwszy = PRESETY_DOKUMENTOW_SOLTYSA[0];
  const [presetId, ustawPresetId] = useState(pierwszy?.id ?? "");
  const preset = znajdzPreset(presetId) ?? pierwszy;

  const opcjeDomyslne = useMemo(
    () => ({
      domyslnaWies,
      domyslnaGmina,
      domyslnySoltysNazwa,
    }),
    [domyslnaWies, domyslnaGmina, domyslnySoltysNazwa]
  );

  const numerReferencyjnySesji = useRef<string | undefined>(undefined);
  if (numerReferencyjnySesji.current === undefined) {
    numerReferencyjnySesji.current = wygenerujNumerReferencyjnySoltys();
  }

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

  function zmienPreset(id: string) {
    ustawPresetId(id);
    const p = znajdzPreset(id);
    if (!p) return;
    const w = domyslneWartosciPol(p);
    if (domyslnaWies && p.pola.some((x) => x.id === "wies")) w.wies = w.wies || domyslnaWies;
    if (domyslnaGmina && p.pola.some((x) => x.id === "gmina")) w.gmina = w.gmina || domyslnaGmina;
    ustawWartosci(uzupelnijDomyslnePresetu(p, w, opcjeDomyslne));
  }

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
      numerReferencyjny: numerReferencyjnySesji.current,
      kontekstSolectwa: kontekstSolectwaDlaMeta(domyslnaWies, domyslnaGmina),
      wygenerowalNazwa: domyslnySoltysNazwa.trim() || undefined,
    };
  }, [domyslnaWies, domyslnaGmina, domyslnySoltysNazwa]);

  const htmlPodglad = useMemo(() => {
    if (!preset) return "";
    return preset.budujHtml(wartosci, metaDokumentu);
  }, [preset, wartosci, metaDokumentu]);

  const nazwaPlikuPdf = useMemo(() => {
    if (!preset) return "naszawies-soltys.pdf";
    const slug = preset.id.replace(/[^a-z0-9-]/gi, "_");
    const d = new Date().toISOString().slice(0, 10);
    const nr = (numerReferencyjnySesji.current ?? "").replace(/[^\w-]+/g, "") || "ref";
    return `naszawies-soltys_${slug}_${nr}_${d}.pdf`;
  }, [preset]);

  if (!preset) {
    return <p className="text-sm text-stone-600">Brak presetów dokumentów.</p>;
  }

  const grupy = pogrupujPresety(PRESETY_DOKUMENTOW_SOLTYSA);

  return (
    <div className="space-y-8">
      <div className="no-print rounded-2xl border border-stone-200 bg-amber-50/40 p-4 text-sm leading-snug text-amber-950">
        Dokumenty są <strong>szablonami informacyjnymi</strong> — nie stanowią porady prawnej. Przed wysłaniem do
        urzędu lub banku dopasuj treść do przepisów i uchwał w Twojej gminie.{" "}
        <strong>Na telefonie</strong> użyj „Pobierz PDF” (zapis pliku); „Drukuj / PDF z systemu” otwiera menu
        drukowania przeglądarki — tam często jest „Zapisz jako PDF”.
      </div>

      <div className="no-print grid gap-6 pb-[max(1rem,env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-8">
        <aside className="min-w-0 space-y-3">
          <h2 className="font-serif text-lg text-green-950">Wybierz dokument</h2>
          <nav
            className="max-h-[min(50vh,28rem)] space-y-5 overflow-y-auto overscroll-y-contain pr-1 text-sm [-webkit-overflow-scrolling:touch]"
            aria-label="Presety dokumentów"
          >
            {grupy.map(([kat, items]) => (
              <div key={kat}>
                <p className="mb-2 font-medium text-stone-800">{kat}</p>
                <ul className="space-y-1 border-l-2 border-green-900/15 pl-3">
                  {items.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => zmienPreset(p.id)}
                        className={`min-h-[44px] w-full touch-manipulation rounded-md px-3 py-2.5 text-left text-[15px] leading-snug hover:bg-stone-100 active:bg-stone-200 sm:min-h-0 sm:py-1.5 sm:text-sm ${
                          p.id === presetId ? "bg-green-900/10 font-medium text-green-950" : "text-stone-700"
                        }`}
                      >
                        {p.tytul}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          <div>
            <h2 className="font-serif text-xl text-green-950">{preset.tytul}</h2>
            <p className="mt-1 text-sm text-stone-600">{preset.opis}</p>
          </div>

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
                className="min-h-[48px] w-full touch-manipulation rounded-lg border-2 border-green-900/35 bg-white px-4 py-3 text-base font-medium text-green-950 shadow-sm hover:bg-green-50 sm:w-auto sm:min-h-[44px] sm:py-2.5 sm:text-sm"
              >
                Drukuj / PDF z systemu
              </button>
            </div>
            {(domyslnaWies || domyslnaGmina || domyslnySoltysNazwa) && (
              <button
                type="button"
                onClick={() =>
                  ustawWartosci((prev) => uzupelnijDomyslnePresetu(preset, prev, opcjeDomyslne))
                }
                className="min-h-[44px] w-full touch-manipulation rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-800 hover:bg-stone-50 sm:w-auto sm:text-sm"
              >
                Wypełnij puste pola z panelu
              </button>
            )}
            <p className="text-sm leading-snug text-stone-500 sm:flex-1 sm:text-xs">
              Podgląd poniżej — przy druku ukrywane są formularz i menu panelu. Numer ref. i znacznik czasu w dokumencie
              są stałe do odświeżenia strony.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 sm:p-4 print:border-0 print:bg-white print:p-0">
        <p className="no-print mb-2 text-xs font-medium text-stone-500 sm:mb-3">Podgląd / wydruk</p>
        <div
          id="soltys-generator-dokument-html"
          className="overflow-x-auto [-webkit-overflow-scrolling:touch] print:overflow-visible"
          dangerouslySetInnerHTML={{ __html: htmlPodglad }}
        />
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
