"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  dodajUrlDokumentacjiZniszczen,
  usunUrlDokumentacjiZniszczen,
  zapiszOpisPoWydarzeniuSwietlica,
} from "@/app/(site)/panel/mieszkaniec/akcje";
import {
  MAX_ZDJEC_DOKUMENTACJA_ZNISZCZEN,
  MAX_ZNAKOW_OPISU_PO_WYDARZENIU,
} from "@/lib/swietlica/limity-dokumentacji-zniszczen";
import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { cofnijWgranyPlikR2, wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

const MAX_BAJTOW = 3 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/webp"] as const;

type Props = {
  bookingId: string;
  urlsPoczatkowe: string[];
  completionNotesPoczatkowe: string | null;
  wasDamagedPoczatkowe: boolean | null;
};

export function DokumentacjaZniszczenRezerwacji({
  bookingId,
  urlsPoczatkowe,
  completionNotesPoczatkowe,
  wasDamagedPoczatkowe,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [blad, ustawBlad] = useState("");
  const [bladOpis, ustawBladOpis] = useState("");
  const [oczekuje, startTransition] = useTransition();
  const [opisLokalny, ustawOpisLokalny] = useState(completionNotesPoczatkowe ?? "");
  const [uszkodzenia, ustawUszkodzenia] = useState(wasDamagedPoczatkowe ?? false);

  useEffect(() => {
    ustawOpisLokalny(completionNotesPoczatkowe ?? "");
    ustawUszkodzenia(wasDamagedPoczatkowe ?? false);
  }, [completionNotesPoczatkowe, wasDamagedPoczatkowe]);

  async function onWyborPliku(plik: File | null) {
    if (!plik) return;
    ustawBlad("");
    if (!MIME.includes(plik.type as (typeof MIME)[number])) {
      ustawBlad("Dozwolone: JPEG, PNG, WebP.");
      return;
    }
    if (plik.size > MAX_BAJTOW) {
      ustawBlad("Maksymalnie 3 MB.");
      return;
    }

    startTransition(async () => {
      try {
        let publicUrl: string;
        let sciezkaSupa: string | null = null;

        if (czyKlientUzywaMagazynuR2()) {
          const fd = new FormData();
          fd.set("typ", "damage");
          fd.set("bookingId", bookingId);
          fd.set("file", plik);
          const w = await wgrajObrazDoMagazynuR2(fd);
          if ("blad" in w) {
            ustawBlad(w.blad);
            return;
          }
          publicUrl = w.publicUrl;
        } else {
          const supabase = utworzKlientaSupabasePrzegladarka();
          const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
          const sciezka = `${bookingId}/${Date.now()}.${ext}`;
          sciezkaSupa = sciezka;

          const { error: uploadBlad } = await supabase.storage.from("hall_booking_damage").upload(sciezka, plik, {
            cacheControl: "3600",
            upsert: false,
            contentType: plik.type,
          });
          if (uploadBlad) {
            ustawBlad(
              uploadBlad.message.includes("Bucket not found")
                ? "Wgrywanie plików jest chwilowo niedostępne. Spróbuj później."
                : uploadBlad.message
            );
            return;
          }

          const {
            data: { publicUrl: urlSupa },
          } = supabase.storage.from("hall_booking_damage").getPublicUrl(sciezka);
          publicUrl = urlSupa;
        }

        const wynik = await dodajUrlDokumentacjiZniszczen(bookingId, publicUrl);
        if ("blad" in wynik) {
          ustawBlad(wynik.blad);
          if (czyKlientUzywaMagazynuR2()) {
            await cofnijWgranyPlikR2(publicUrl);
          } else if (sciezkaSupa) {
            const supabase = utworzKlientaSupabasePrzegladarka();
            await supabase.storage.from("hall_booking_damage").remove([sciezkaSupa]);
          }
          return;
        }
        router.refresh();
      } catch {
        ustawBlad("Nie udało się wgrać pliku.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  async function onUsun(url: string) {
    ustawBlad("");
    startTransition(async () => {
      const wynik = await usunUrlDokumentacjiZniszczen(bookingId, url);
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      router.refresh();
    });
  }

  async function onZapiszOpis() {
    ustawBladOpis("");
    startTransition(async () => {
      const wynik = await zapiszOpisPoWydarzeniuSwietlica(bookingId, {
        was_damaged: uszkodzenia,
        completion_notes: opisLokalny.trim().length ? opisLokalny.trim() : null,
      });
      if ("blad" in wynik) {
        ustawBladOpis(wynik.blad);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      <p className="text-xs font-medium text-stone-600">Dokumentacja stanu po wydarzeniu</p>
      <p className="mt-1 text-[11px] text-stone-500">
        Zdjęcia i uwagi są widoczne w załączniku informacyjnym do wynajmu tej świetlicy (strona dokumentu).
      </p>

      <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2">
          <span className="text-xs font-medium text-stone-700">Zdjęcia</span>
          <span
            className="tabular-nums text-xs text-stone-600"
            aria-live="polite"
            title="Liczba wgranych zdjęć dokumentacyjnych"
          >
            <span className="font-medium text-stone-900">{urlsPoczatkowe.length}</span>
            <span className="text-stone-400"> / </span>
            {MAX_ZDJEC_DOKUMENTACJA_ZNISZCZEN}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {urlsPoczatkowe.map((url) => (
            <div key={url} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={oczekuje}
                onClick={() => void onUsun(url)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={oczekuje || urlsPoczatkowe.length >= MAX_ZDJEC_DOKUMENTACJA_ZNISZCZEN}
            onChange={(e) => void onWyborPliku(e.target.files?.[0] ?? null)}
            className="max-w-full text-xs text-stone-600 file:mr-2 file:rounded file:border-0 file:bg-stone-200 file:px-2 file:py-1 file:text-xs file:font-medium hover:file:bg-stone-300"
          />
          <p className="mt-1 text-[11px] text-stone-500">JPEG / PNG / WebP, do 3 MB.</p>
        </div>
      </div>
      {blad ? (
        <p className="mt-2 text-xs text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={uszkodzenia}
            onChange={(e) => ustawUszkodzenia(e.target.checked)}
            className="rounded border-stone-300"
          />
          Zgłaszam uszkodzenia mienia / naruszenie stanu sali po wydarzeniu
        </label>
        <label className="block text-xs font-medium text-stone-600" htmlFor={`opis-${bookingId}`}>
          Uwagi (opis sytuacji)
        </label>
        <textarea
          id={`opis-${bookingId}`}
          value={opisLokalny}
          onChange={(e) => ustawOpisLokalny(e.target.value)}
          rows={3}
          maxLength={MAX_ZNAKOW_OPISU_PO_WYDARZENIU}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          placeholder="np. zarysowanie podłogi przy wejściu, uszkodzony element…"
        />
        <p
          className="text-right text-[11px] tabular-nums text-stone-500"
          aria-live="polite"
        >
          <span
            className={
              opisLokalny.length >= MAX_ZNAKOW_OPISU_PO_WYDARZENIU ? "font-medium text-amber-800" : ""
            }
          >
            {opisLokalny.length}
          </span>
          {" / "}
          {MAX_ZNAKOW_OPISU_PO_WYDARZENIU} znaków
        </p>
        <button
          type="button"
          disabled={oczekuje}
          onClick={() => void onZapiszOpis()}
          className="rounded-lg bg-green-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-950 disabled:opacity-50"
        >
          Zapisz opis i zgłoszenie
        </button>
        {bladOpis ? (
          <p className="text-xs text-red-800" role="alert">
            {bladOpis}
          </p>
        ) : null}
      </div>
    </div>
  );
}
