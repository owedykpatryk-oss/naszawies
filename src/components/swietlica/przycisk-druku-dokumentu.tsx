"use client";

import { PrzyciskPobierzPdf } from "@/components/dokumenty/przycisk-pobierz-pdf";

type Props = {
  /** Element z treścią dokumentu (klon bez .no-print trafia do PDF) */
  elementId?: string;
  /** Nazwa pliku zapisu (bez pełnej ścieżki) */
  nazwaPliku?: string;
};

export function PrzyciskDrukuDokumentu({
  elementId = "dokument-wynajmu-root",
  nazwaPliku = "dokument-wynajmu-naszawies.pdf",
}: Props) {
  return (
    <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <PrzyciskPobierzPdf elementId={elementId} nazwaPliku={nazwaPliku} className="sm:shrink-0" />
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-[48px] w-full touch-manipulation rounded-lg border-2 border-green-900/35 bg-white px-4 py-3 text-base font-medium text-green-950 shadow-sm hover:bg-green-50 sm:w-auto sm:min-h-[44px] sm:py-2.5 sm:text-sm"
        >
          Drukuj / PDF z systemu
        </button>
      </div>
      <p className="text-sm leading-snug text-stone-600 sm:max-w-lg sm:flex-1 sm:self-center sm:text-xs">
        <strong className="text-stone-800">Na telefonie:</strong> „Pobierz PDF” zapisuje plik w folderze Pobrane / Pliki
        (Chrome, Edge, Firefox na Androidzie; Safari — udostępnianie / Pliki). „Drukuj / PDF z systemu” otwiera okno
        systemowe — tam często jest opcja „Zapisz jako PDF”, jeśli nie masz drukarki.
      </p>
    </div>
  );
}
