"use client";

import Link from "next/link";

/** Pasek informacyjny w trybie podglądu (?podglad=1) — widoczny tylko dla sołtysa w edytorze. */
export function BanerPodgladuProfiluWies() {
  return (
    <div
      className="mb-4 rounded-xl border border-amber-300/90 bg-gradient-to-r from-amber-50 via-amber-50/80 to-white px-3 py-2.5 text-sm text-amber-950 shadow-sm ring-1 ring-amber-200/50 sm:mb-6 sm:px-4 sm:py-3"
      role="status"
    >
      <p className="font-medium">Tryb podglądu profilu</p>
      <p className="mt-1 text-amber-900/90">
        Tak zobaczą mieszkańcy stronę po zapisaniu ustawień.{" "}
        <Link href="/panel/soltys/moja-wies" className="font-medium text-green-900 underline">
          Wróć do edycji wyglądu
        </Link>
      </p>
    </div>
  );
}
