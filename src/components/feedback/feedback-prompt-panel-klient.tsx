"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pobierzStanAnkietyFeedback } from "@/app/(site)/panel/akcje-feedback";
import { FeedbackAnkietaKlient } from "@/components/feedback/feedback-ankieta-klient";

/** Automatyczny baner ankiety (14+ dni) na górze panelu. */
export function FeedbackPromptPanelKlient() {
  const [stan, ustawStan] = useState<Awaited<ReturnType<typeof pobierzStanAnkietyFeedback>> | null>(null);
  const [ukryty, ustawUkryty] = useState(false);

  useEffect(() => {
    void pobierzStanAnkietyFeedback().then(ustawStan);
  }, []);

  if (!stan?.zalogowany || !stan.pokazAutomatycznyPrompt || ukryty) return null;

  return (
    <div className="no-print mb-6 rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/95 via-white to-emerald-50/40 p-4 shadow-sm ring-1 ring-sky-100/80 sm:p-5">
      <FeedbackAnkietaKlient
        surveyKind="onboarding_14d"
        tryb="baner"
        dniOdRejestracji={stan.dniOdRejestracji}
        pokazPrzyciskiOdroczenia
        onSukces={() => ustawUkryty(true)}
        onZamknij={() => ustawUkryty(true)}
      />
      <p className="mt-3 text-center text-xs text-stone-500">
        W każdej chwili:{" "}
        <Link href="/panel/sugestie" className="font-medium text-green-800 underline">
          Panel → Sugestie
        </Link>
      </p>
    </div>
  );
}
