"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { dodajZgloszenieProblemu } from "../akcje-zgloszenia";
import { kategorieZgloszen, SZYBKIE_OZNACZENIA } from "@/lib/zgloszenia/szybkie-etykiety";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

const MAX_BAJTOW = 3 * 1024 * 1024;
const MAX_ZDJEC = 6;
const MIME = ["image/jpeg", "image/png", "image/webp"] as const;

type WiesOpcja = { id: string; name: string };
type UserRef = { id: string };

type Props = { wiesOpcje: WiesOpcja[]; uzytkownik: UserRef };

function domyslnaLokalnaDataCzas() {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ZgloszeniaFormularzKlient({ wiesOpcje, uzytkownik }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [oczekuje, startT] = useTransition();
  const [podajKiedy, ustawPodajKiedy] = useState(false);
  const [terminWidmo, ustawTerminWidmo] = useState(domyslnaLokalnaDataCzas);
  const [szybkie, ustawSzybkie] = useState<Record<string, boolean>>({});
  const [pliki, ustawPliki] = useState<File[]>([]);

  const wies = useMemo(() => wiesOpcje[0]?.id ?? "", [wiesOpcje]);

  if (wiesOpcje.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Aby zgłaszać problemy, potrzebujesz <strong>aktywnej roli mieszkańca, sołtysa lub współadmina</strong> w wybranej
        wsi. Złóż wniosek w{" "}
        <a href="/panel/mieszkaniec" className="font-medium underline">
          panelu mieszkańca
        </a>
        .
      </p>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    const villageId = String(fd.get("village_id") || "");
    const category = String(fd.get("category") || "inne");
    const title = String(fd.get("title") || "").trim();
    const description = String(fd.get("description") || "").trim();
    const locationText = String(fd.get("location_text") || "").trim();
    const isUrgent = fd.get("is_urgent") === "on";
    if (!villageId) {
      ustawBlad("Wybierz wieś.");
      return;
    }
    if (pliki.length > MAX_ZDJEC) {
      ustawBlad(`Maksymalnie ${MAX_ZDJEC} zdjęć.`);
      return;
    }
    for (const f of pliki) {
      if (!MIME.includes(f.type as (typeof MIME)[number]) || f.size > MAX_BAJTOW) {
        ustawBlad("Zdjęcia: JPEG, PNG, WebP, maks. 3 MB każde.");
        return;
      }
    }

    const observedAt = podajKiedy && terminWidmo ? new Date(terminWidmo).toISOString() : null;
    if (podajKiedy && Number.isNaN(new Date(terminWidmo).getTime())) {
      ustawBlad("Niepoprawna data / godzina zauważenia.");
      return;
    }

    const quickFlags: Record<string, boolean> = {};
    for (const s of SZYBKIE_OZNACZENIA) {
      if (szybkie[s.key]) quickFlags[s.key] = true;
    }

    startT(async () => {
      const imageUrls: string[] = [];
      if (pliki.length > 0) {
        const supabase = utworzKlientaSupabasePrzegladarka();
        for (let i = 0; i < pliki.length; i++) {
          const plik = pliki[i];
          const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
          const sciezka = `${villageId}/${uzytkownik.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: uE } = await supabase.storage.from("village_issues").upload(sciezka, plik, {
            contentType: plik.type,
            cacheControl: "3600",
            upsert: false,
          });
          if (uE) {
            ustawBlad(
              uE.message.includes("Bucket not found")
                ? "Bucket zdjęć (village_issues) — uruchom migrację w Supabase."
                : uE.message
            );
            return;
          }
          const {
            data: { publicUrl },
          } = supabase.storage.from("village_issues").getPublicUrl(sciezka);
          imageUrls.push(publicUrl);
        }
      }

      const w = await dodajZgloszenieProblemu({
        villageId,
        category: category as "droga" | "oswietlenie" | "woda" | "prad" | "smieci" | "infrastruktura" | "inne",
        title,
        description,
        locationText: locationText || null,
        isUrgent,
        observedAt,
        imageUrls,
        quickFlags: Object.keys(quickFlags).length ? quickFlags : undefined,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawPliki([]);
      ustawSzybkie({});
      ustawPodajKiedy(false);
      (e.target as HTMLFormElement).reset();
      ustawTerminWidmo(domyslnaLokalnaDataCzas());
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zgl-wies">
          Wieś
        </label>
        <select
          id="zgl-wies"
          name="village_id"
          required
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          defaultValue={wies}
        >
          {wiesOpcje.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zgl-kat">
          Kategoria
        </label>
        <select id="zgl-kat" name="category" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
          {kategorieZgloszen.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zgl-tyt">
          Tytuł
        </label>
        <input
          id="zgl-tyt"
          name="title"
          required
          minLength={3}
          maxLength={200}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          placeholder="np. Dziura przy skrzyżowaniu"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zgl-opis">
          Opis
        </label>
        <textarea
          id="zgl-opis"
          name="description"
          required
          minLength={10}
          rows={4}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          placeholder="Dokładnie: co, gdzie, od jak dawna, czy były interwencje"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zgl-miejsce">
          Miejsce (opcjonalnie)
        </label>
        <input
          id="zgl-miejsce"
          name="location_text"
          maxLength={500}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          placeholder="np. droga do lasu, za sklepem, nr lampy"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-800">Szybkie zaznaczenia (opcjonalne)</p>
        <ul className="space-y-2 text-sm text-stone-800">
          {SZYBKIE_OZNACZENIA.map((o) => (
            <li key={o.key}>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-green-800"
                  checked={!!szybkie[o.key]}
                  onChange={() => ustawSzybkie((p) => ({ ...p, [o.key]: !p[o.key] }))}
                />
                <span>{o.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-800">
        <input name="is_urgent" type="checkbox" className="mt-0.5 accent-amber-700" />
        <span>Pilne / wymaga szybszej reakcji</span>
      </label>

      <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-800">
          <input
            type="checkbox"
            checked={podajKiedy}
            onChange={() => {
              ustawPodajKiedy((v) => {
                if (!v) ustawTerminWidmo(domyslnaLokalnaDataCzas());
                return !v;
              });
            }}
            className="accent-green-800"
          />
          Podaj datę i godzinę, kiedy to zauważono
        </label>
        {podajKiedy ? (
          <div className="mt-2">
            <input
              type="datetime-local"
              value={terminWidmo}
              onChange={(e) => ustawTerminWidmo(e.target.value)}
              className="w-full max-w-sm rounded border border-stone-300 bg-white px-2 py-1.5 text-sm"
            />
            <p className="mt-1 text-xs text-stone-500">
              Inna niż «wysłano zgłoszenie» — pomaga sołtysowi ustalić sytuację. Możesz odznaczyć, jeśli daty nie znasz.
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zgl-foto">
          Zdjęcia (opcjonalnie, do {MAX_ZDJEC} zdjęć, max 3 MB każde)
        </label>
        <input
          id="zgl-foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-green-100 file:px-3 file:py-1.5"
          onChange={(e) => {
            const l = e.target.files ? Array.from(e.target.files) : [];
            ustawPliki(l.slice(0, MAX_ZDJEC));
          }}
        />
        {pliki.length > 0 ? (
          <p className="mt-1 text-xs text-stone-500">Wybrano: {pliki.length} plik(ów)</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={oczekuje}
        className="rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
      >
        {oczekuje ? "Wysyłanie…" : "Wyślij zgłoszenie"}
      </button>
    </form>
  );
}
