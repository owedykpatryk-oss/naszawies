"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import {
  wyslijOpiniePlatformy,
  odroczPromptAnkiety,
  wylaczAutomatycznyPromptAnkiety,
} from "@/app/(site)/panel/akcje-feedback";
import {
  CHIPY_CO_DZIALA,
  CHIPY_CO_ULEPSZYC,
  ETYKIETY_OCENY,
  type RodzajAnkiety,
} from "@/lib/feedback/konfiguracja-ankiety";

type Props = {
  surveyKind: RodzajAnkiety;
  tryb?: "baner" | "strona";
  dniOdRejestracji?: number | null;
  onSukces?: () => void;
  onZamknij?: () => void;
  pokazPrzyciskiOdroczenia?: boolean;
};

function dolaczChip(tekst: string, chip: string): string {
  const t = tekst.trim();
  if (!t) return chip;
  if (t.includes(chip)) return t;
  return `${t}\n• ${chip}`;
}

export function FeedbackAnkietaKlient({
  surveyKind,
  tryb = "strona",
  dniOdRejestracji = null,
  onSukces,
  onZamknij,
  pokazPrzyciskiOdroczenia = false,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState(false);
  const [ocena, ustawOcene] = useState<number | null>(null);
  const [latwosc, ustawLatwosc] = useState<number | null>(null);
  const [coDziala, ustawCoDziala] = useState("");
  const [coUlepszyc, ustawCoUlepszyc] = useState("");
  const [notatka, ustawNotatka] = useState("");

  const naglowek = useMemo(() => {
    if (surveyKind === "onboarding_14d") {
      return dniOdRejestracji != null
        ? `Korzystasz z nas od ${dniOdRejestracji} dni — jak Ci idzie?`
        : "Jak oceniasz naszawies.pl po pierwszych dniach?";
    }
    return "Twoja sugestia pomoże nam ulepszyć serwis";
  }, [surveyKind, dniOdRejestracji]);

  function wyslij(e: FormEvent) {
    e.preventDefault();
    ustawBlad("");
    startTransition(async () => {
      const w = await wyslijOpiniePlatformy({
        surveyKind,
        ratingOverall: ocena,
        ratingEase: latwosc,
        whatWorks: coDziala || null,
        whatImprove: coUlepszyc || null,
        freeNotes: notatka || null,
        pagePath: typeof window !== "undefined" ? window.location.pathname : null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawSukces(true);
      onSukces?.();
    });
  }

  function odrocz() {
    startTransition(async () => {
      await odroczPromptAnkiety();
      onZamknij?.();
    });
  }

  function nigdy() {
    startTransition(async () => {
      await wylaczAutomatycznyPromptAnkiety();
      onZamknij?.();
    });
  }

  if (sukces) {
    return (
      <div className={`rounded-2xl border border-green-200 bg-green-50/90 p-5 text-center ${tryb === "baner" ? "" : "shadow-sm"}`}>
        <p className="text-lg font-medium text-green-900">Dziękujemy!</p>
        <p className="mt-2 text-sm text-stone-700">
          Twoja opinia trafiła do zespołu. Możesz wrócić tu kiedy chcesz —{" "}
          <span className="font-medium">Panel → Sugestie</span>.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={wyslij}
      className={`space-y-4 ${tryb === "baner" ? "" : "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-green-800/90">Twoja opinia</p>
        <h2 className="mt-1 font-serif text-lg text-green-950 sm:text-xl">{naglowek}</h2>
        <p className="mt-1 text-sm text-stone-600">
          30 sekund — wybierz ocenę, kliknij gotowe uwagi lub dopisz własne. Pomaga nam wiedzieć, co działa, a co poprawić.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-stone-800">Ogólne wrażenie</legend>
        <div className="flex flex-wrap gap-2">
          {ETYKIETY_OCENY.map((o) => (
            <button
              key={o.wartosc}
              type="button"
              title={o.opis}
              onClick={() => ustawOcene(o.wartosc)}
              className={`min-h-11 min-w-11 rounded-xl border px-2 text-xl transition ${
                ocena === o.wartosc
                  ? "border-green-700 bg-green-100 ring-2 ring-green-800/30"
                  : "border-stone-200 bg-white hover:border-green-400"
              }`}
            >
              {o.emoji}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-stone-800">Łatwość obsługi (opcjonalnie)</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => ustawLatwosc(n)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${
                latwosc === n ? "bg-green-800 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800">Co działa dobrze?</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {CHIPY_CO_DZIALA.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ustawCoDziala((t) => dolaczChip(t, c))}
              className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-xs text-emerald-950 hover:bg-emerald-100"
            >
              + {c}
            </button>
          ))}
        </div>
        <textarea
          value={coDziala}
          onChange={(e) => ustawCoDziala(e.target.value)}
          rows={2}
          maxLength={3000}
          placeholder="Np. szybkie dodawanie wydarzeń, czytelny profil wsi…"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800">Co można ulepszyć?</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {CHIPY_CO_ULEPSZYC.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ustawCoUlepszyc((t) => dolaczChip(t, c))}
              className="rounded-full border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-xs text-amber-950 hover:bg-amber-100"
            >
              + {c}
            </button>
          ))}
        </div>
        <textarea
          value={coUlepszyc}
          onChange={(e) => ustawCoUlepszyc(e.target.value)}
          rows={3}
          maxLength={3000}
          placeholder="To najważniejsze dla nas — konkretna uwaga, ekran, funkcja…"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800">Dodatkowa notatka (opcjonalnie)</label>
        <textarea
          value={notatka}
          onChange={(e) => ustawNotatka(e.target.value)}
          rows={2}
          maxLength={4000}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      {blad ? (
        <p className="text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-xl bg-green-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          {pending ? "Wysyłam…" : "Wyślij opinię"}
        </button>
        {pokazPrzyciskiOdroczenia ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={odrocz}
              className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-50"
            >
              Przypomnij za tydzień
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={nigdy}
              className="text-sm text-stone-500 underline hover:text-stone-800"
            >
              Nie pytaj więcej
            </button>
          </>
        ) : null}
        {onZamknij && !pokazPrzyciskiOdroczenia ? (
          <button type="button" onClick={onZamknij} className="text-sm text-stone-600 underline">
            Zamknij
          </button>
        ) : null}
      </div>
    </form>
  );
}
