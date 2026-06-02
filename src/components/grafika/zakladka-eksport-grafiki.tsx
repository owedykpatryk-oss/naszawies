"use client";

import { PrzyciskPobierzPdf } from "@/components/dokumenty/przycisk-pobierz-pdf";
import { EksportSocialKlient } from "@/components/grafika/eksport-social-klient";
import { IntegracjaPlakatuKlient } from "@/components/grafika/integracja-plakatu-klient";
import { PrzyciskSzablonSpolecznosci } from "@/components/grafika/przycisk-szablon-spolecznosci";
import { KopiujLinkProjektu } from "@/components/grafika/kopiuj-link-projektu";
import { PrzyciskPngPodglad } from "@/components/grafika/przycisk-png-podglad";
import { WyslijGrafikeEmailKlient } from "@/components/grafika/wyslij-grafike-email-klient";
import { ZachetaKontaGrafiki } from "@/components/grafika/zacheta-konta-grafiki";
import type { TrybPracyGrafiki } from "@/lib/grafika/kreator-zakladki";
import type { MotywGrafiki, ProjektGrafiki, SzablonGrafiki } from "@/lib/grafika/typy";

type Props = {
  elementId: string;
  nazwaPliku: string;
  szablon: SzablonGrafiki;
  motyw: MotywGrafiki;
  motywId: string;
  trybKreatora?: TrybPracyGrafiki;
  wartosci: Record<string, string>;
  logoDataUrl: string | null;
  backgroundDataUrl: string | null;
  backgroundOverlay: number;
  qrUrl: string;
  villageId: string | null;
  nazwaWsi: string;
  projekty: ProjektGrafiki[];
  ostatniZapisId: string | null;
  maDateWydarzenia: boolean;
  trybSoltys: boolean;
  zapisDoBazy: boolean;
  trybPubliczny: boolean;
  oczekuje: boolean;
  liczbaSzablonow: number;
  nextSciezka: string;
  onZapisz: () => void;
  onOpublikuj: () => void;
  onWczytaj: (p: ProjektGrafiki) => void;
  onUsun: (id: string) => void;
  onResetTresci: () => void;
  onKomunikat: (t: string) => void;
  onBlad: (t: string) => void;
  onDuplikuj: () => void;
  onWstecz: () => void;
  tytulProjektu?: string;
  linkedPostId?: string | null;
  linkedEventId?: string | null;
  featuredOnDigitalBoard?: boolean;
  onOdswiezProjekty?: () => void;
  onOdswiezSzablonySpolecznosci?: () => void;
};

export function ZakladkaEksportGrafiki({
  elementId,
  nazwaPliku,
  szablon,
  motyw,
  motywId,
  trybKreatora = "zaproszenie",
  wartosci,
  logoDataUrl,
  backgroundDataUrl,
  backgroundOverlay,
  qrUrl,
  villageId,
  nazwaWsi,
  projekty,
  ostatniZapisId,
  maDateWydarzenia,
  trybSoltys,
  zapisDoBazy,
  trybPubliczny,
  oczekuje,
  liczbaSzablonow,
  nextSciezka,
  onZapisz,
  onOpublikuj,
  onWczytaj,
  onUsun,
  onResetTresci,
  onKomunikat,
  onBlad,
  onDuplikuj,
  onWstecz,
  tytulProjektu,
  linkedPostId,
  linkedEventId,
  featuredOnDigitalBoard,
  onOdswiezProjekty,
  onOdswiezSzablonySpolecznosci,
}: Props) {
  const brakujeDaty = !maDateWydarzenia && szablon.pola.some((p) => p.id === "data");
  return (
    <section className="no-print space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-serif text-lg text-green-950">Pobierz i udostępnij</h2>
        <p className="mt-1 text-sm text-stone-600">PDF, druk, social media i e-mail — wszystko w jednym miejscu.</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
          <PrzyciskPobierzPdf elementId={elementId} nazwaPliku={nazwaPliku} />
          <PrzyciskPngPodglad elementId={elementId} nazwaPliku={nazwaPliku} />
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[48px] rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800"
          >
            Drukuj
          </button>
          <KopiujLinkProjektu
            szablonId={szablon.id}
            motywId={motywId}
            tryb={trybKreatora === "dyplomy" ? "dyplomy" : "zaproszenie"}
            wartosci={wartosci}
            tytulProjektu={tytulProjektu}
          />
        </div>

        {brakujeDaty ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Brak daty w polu „Data” — PDF wyjdzie poprawnie, ale integracja z kalendarzem wsi wymaga uzupełnienia daty w
            kroku 2.
          </p>
        ) : null}

        <EksportSocialKlient
          szablon={szablon}
          motyw={motyw}
          wartosci={wartosci}
          logoDataUrl={logoDataUrl}
          backgroundDataUrl={backgroundDataUrl}
          backgroundOverlay={backgroundOverlay}
          qrUrl={qrUrl}
          nazwaPliku={nazwaPliku}
        />

        <WyslijGrafikeEmailKlient elementId={elementId} domyslnyTemat={nazwaPliku} nazwaPliku={nazwaPliku} />

        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={onZapisz}
            disabled={oczekuje}
            className="rounded-lg border border-green-800 px-3 py-2 text-sm text-green-900 hover:bg-green-50 disabled:opacity-60"
          >
            {oczekuje ? "Zapisuję…" : zapisDoBazy ? "Zapisz projekt" : "Zapisz szkic lokalnie"}
          </button>
          {trybSoltys && zapisDoBazy ? (
            <button
              type="button"
              onClick={onOpublikuj}
              disabled={oczekuje}
              className="rounded-lg border border-emerald-700 px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-50"
            >
              Opublikuj na profilu wsi
            </button>
          ) : null}
          <button
            type="button"
            onClick={onResetTresci}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600"
          >
            Cofnij treść do domyślnej
          </button>
          <button
            type="button"
            onClick={onDuplikuj}
            className="rounded-lg border border-indigo-300 px-3 py-2 text-sm text-indigo-900 hover:bg-indigo-50"
          >
            Duplikuj szkic
          </button>
        </div>

        {!zapisDoBazy && trybPubliczny ? (
          <div className="mt-4">
            <ZachetaKontaGrafiki wariant="zapis" liczbaSzablonow={liczbaSzablonow} nextSciezka={nextSciezka} />
          </div>
        ) : null}

        <IntegracjaPlakatuKlient
          projektId={ostatniZapisId}
          maDate={maDateWydarzenia}
          trybSoltys={trybSoltys}
          zapisDoBazy={zapisDoBazy}
          linkedPostId={linkedPostId}
          linkedEventId={linkedEventId}
          featuredOnDigitalBoard={featuredOnDigitalBoard}
          onKomunikat={onKomunikat}
          onBlad={onBlad}
          onOdswiez={onOdswiezProjekty}
        />

        <PrzyciskSzablonSpolecznosci
          szablon={szablon}
          motywId={motywId}
          tytulProjektu={tytulProjektu ?? szablon.tytul}
          wartosci={wartosci}
          logoDataUrl={logoDataUrl}
          backgroundDataUrl={backgroundDataUrl}
          backgroundOverlay={backgroundOverlay}
          qrUrl={qrUrl}
          villageId={villageId}
          nazwaWsi={nazwaWsi}
          onKomunikat={onKomunikat}
          onBlad={onBlad}
          onOpublikowano={onOdswiezSzablonySpolecznosci}
        />

        {projekty.length > 0 ? (
          <details className="mt-4 border-t border-stone-100 pt-3">
            <summary className="cursor-pointer text-sm font-medium text-stone-700">
              Wczytaj zapisany projekt ({projekty.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {projekty.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded bg-stone-50 px-2 py-1.5 text-sm">
                  <button type="button" onClick={() => onWczytaj(p)} className="truncate text-green-800 underline">
                    {p.tytul}
                  </button>
                  <button type="button" onClick={() => onUsun(p.id)} className="text-xs text-red-700" aria-label="Usuń">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <button type="button" onClick={onWstecz} className="mt-4 text-sm text-stone-500 underline">
          ← Popraw treść lub wygląd
        </button>
      </div>

      {trybPubliczny ? (
        <ZachetaKontaGrafiki wariant="kompakt" liczbaSzablonow={liczbaSzablonow} nextSciezka={nextSciezka} />
      ) : null}
    </section>
  );
}
