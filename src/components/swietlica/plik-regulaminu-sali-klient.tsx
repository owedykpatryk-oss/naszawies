"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { usunPlikRegulaminuSali, zapiszPlikRegulaminuSali } from "@/app/(site)/panel/soltys/akcje";
import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

const MAX_BAJTOW = 10 * 1024 * 1024;
const MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

type Props = {
  hallId: string;
  rulesFileUrlPoczatek: string | null;
  rulesFileNamePoczatek: string | null;
};

function czyPdf(url: string): boolean {
  return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf");
}

export function PlikRegulaminuSaliKlient({
  hallId,
  rulesFileUrlPoczatek,
  rulesFileNamePoczatek,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, ustawUrl] = useState(rulesFileUrlPoczatek);
  const [nazwa, ustawNazwe] = useState(rulesFileNamePoczatek);
  const [blad, ustawBlad] = useState("");
  const [oczekuje, startTransition] = useTransition();

  async function onWyborPliku(plik: File | null) {
    if (!plik) return;
    ustawBlad("");
    if (!MIME.includes(plik.type as (typeof MIME)[number])) {
      ustawBlad("Dozwolone: PDF, JPEG, PNG, WebP.");
      return;
    }
    if (plik.size > MAX_BAJTOW) {
      ustawBlad("Maksymalnie 10 MB.");
      return;
    }

    startTransition(async () => {
      try {
        let publicUrl: string;

        if (czyKlientUzywaMagazynuR2()) {
          const fd = new FormData();
          fd.set("typ", "rules");
          fd.set("hallId", hallId);
          fd.set("file", plik);
          const w = await wgrajObrazDoMagazynuR2(fd);
          if ("blad" in w) {
            ustawBlad(w.blad);
            return;
          }
          publicUrl = w.publicUrl;
        } else {
          const supabase = utworzKlientaSupabasePrzegladarka();
          const ext =
            plik.type === "application/pdf"
              ? "pdf"
              : plik.type === "image/png"
                ? "png"
                : plik.type === "image/webp"
                  ? "webp"
                  : "jpg";
          const sciezka = `${hallId}/regulamin-${Date.now()}.${ext}`;
          const { error: uploadBlad } = await supabase.storage.from("hall_rules").upload(sciezka, plik, {
            cacheControl: "3600",
            upsert: false,
            contentType: plik.type,
          });
          if (uploadBlad) {
            ustawBlad(
              uploadBlad.message.includes("Bucket not found")
                ? "Zapisywanie plików jest chwilowo niedostępne. Uruchom migrację bazy."
                : uploadBlad.message
            );
            return;
          }
          const {
            data: { publicUrl: urlSupa },
          } = supabase.storage.from("hall_rules").getPublicUrl(sciezka);
          publicUrl = urlSupa;
        }

        const wynik = await zapiszPlikRegulaminuSali({
          hallId,
          rules_file_url: publicUrl,
          rules_file_name: plik.name,
        });
        if ("blad" in wynik) {
          ustawBlad(wynik.blad);
          return;
        }
        ustawUrl(publicUrl);
        ustawNazwe(plik.name);
        router.refresh();
      } catch {
        ustawBlad("Nie udało się wgrać pliku.");
      }
    });
  }

  function usun() {
    ustawBlad("");
    startTransition(async () => {
      const w = await usunPlikRegulaminuSali(hallId);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawUrl(null);
      ustawNazwe(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-4">
      <h3 className="text-sm font-semibold text-stone-800">Oficjalny regulamin jako plik (PDF / skan)</h3>
      <p className="mt-1 text-xs text-stone-600">
        Wgraj uchwałę, skan regulaminu lub plakat — link pojawi się w dokumencie wynajmu dla mieszkańców. Tekst powyżej
        nadal możesz uzupełnić osobno.
      </p>

      {url ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-green-800 underline"
          >
            {nazwa ?? "Pobierz regulamin"}
          </a>
          {czyPdf(url) ? (
            <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-800">PDF</span>
          ) : (
            <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-800">Obraz</span>
          )}
          <button
            type="button"
            disabled={oczekuje}
            onClick={usun}
            className="text-xs text-red-800 underline disabled:opacity-50"
          >
            Usuń plik
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-stone-500">Brak wgranego pliku — opcjonalnie, obok treści tekstowej.</p>
      )}

      <div className="mt-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            void onWyborPliku(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={oczekuje}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-green-800/40 bg-white px-3 py-1.5 text-sm text-green-900 hover:bg-green-50 disabled:opacity-60"
        >
          {oczekuje ? "Wgrywanie…" : url ? "Wgraj inny plik" : "Wgraj PDF lub obraz"}
        </button>
      </div>

      {blad ? (
        <p className="mt-2 text-xs text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
    </div>
  );
}
