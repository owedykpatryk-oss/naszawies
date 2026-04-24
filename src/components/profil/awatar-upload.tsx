"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { aktualizujAvatarZWeryfikowanegoUrl, usunAvatar, type WynikAkcjiProfilu } from "@/app/(site)/panel/profil/akcje";
import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

const MAX_BAJTOW = 2 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/webp"] as const;

type Props = {
  userId: string;
  aktualnyUrl: string | null;
};

export function AwatarUpload({ userId, aktualnyUrl }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");

  async function onWyborPliku(plik: File | null) {
    if (!plik) return;
    ustawBlad("");
    if (!MIME.includes(plik.type as (typeof MIME)[number])) {
      ustawBlad("Dozwolone formaty: JPEG, PNG, WebP.");
      return;
    }
    if (plik.size > MAX_BAJTOW) {
      ustawBlad("Maksymalny rozmiar pliku to 2 MB.");
      return;
    }

    ustawLaduje(true);
    try {
      let publicUrl: string;

      if (czyKlientUzywaMagazynuR2()) {
        const fd = new FormData();
        fd.set("typ", "avatar");
        fd.set("file", plik);
        const w = await wgrajObrazDoMagazynuR2(fd);
        if ("blad" in w) {
          ustawBlad(w.blad);
          return;
        }
        publicUrl = w.publicUrl;
      } else {
        const supabase = utworzKlientaSupabasePrzegladarka();
        const rozszerzenie = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
        const sciezka = `${userId}/avatar-${Date.now()}.${rozszerzenie}`;

        const { error: uploadBlad } = await supabase.storage.from("avatars").upload(sciezka, plik, {
          cacheControl: "3600",
          upsert: true,
          contentType: plik.type,
        });
        if (uploadBlad) {
          ustawBlad(
            uploadBlad.message.includes("Bucket not found")
              ? "Zapisywanie zdjęć jest chwilowo niedostępne. Spróbuj później lub skontaktuj się z obsługą serwisu."
              : uploadBlad.message
          );
          return;
        }

        const {
          data: { publicUrl: urlSupa },
        } = supabase.storage.from("avatars").getPublicUrl(sciezka);
        publicUrl = urlSupa;
      }

      const wynik: WynikAkcjiProfilu = await aktualizujAvatarZWeryfikowanegoUrl(publicUrl);
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      router.refresh();
    } catch {
      ustawBlad("Nie udało się wgrać pliku.");
    } finally {
      ustawLaduje(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onUsun() {
    ustawBlad("");
    ustawLaduje(true);
    try {
      const wynik = await usunAvatar();
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      router.refresh();
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="mb-1 block text-sm font-medium text-stone-700">Zdjęcie profilowe</span>
      <div className="flex flex-wrap items-end gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
          {aktualnyUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL z Supabase Storage (różne hosty projektów)
            <img src={aktualnyUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-stone-400">?</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="max-w-xs text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-900"
            disabled={laduje}
            onChange={(e) => void onWyborPliku(e.target.files?.[0] ?? null)}
          />
          {aktualnyUrl ? (
            <button
              type="button"
              disabled={laduje}
              onClick={() => void onUsun()}
              className="text-left text-sm text-red-800 underline disabled:opacity-50"
            >
              Usuń zdjęcie
            </button>
          ) : null}
        </div>
      </div>
      {blad ? (
        <p className="text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <p className="text-xs text-stone-500">
        JPEG, PNG lub WebP, do 2 MB.{" "}
        Plik jest przechowywany w bezpiecznej infrastrukturze serwisu.
      </p>
    </div>
  );
}
