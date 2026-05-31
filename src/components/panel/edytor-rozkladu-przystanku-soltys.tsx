"use client";

import { FormEvent, useState, useTransition } from "react";
import Image from "next/image";
import {
  aktualizujZdjecieTabliczkiPrzystanku,
  usunRecznyRozkladPrzystanku,
  zapiszRozkladPrzystankuSoltysa,
} from "@/app/(site)/panel/soltys/akcje-rozklad-przystanku";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";
import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import {
  dniRozkladuPrzystanku,
  nowyKursRozkladu,
  parsujRozkladPrzystankuReczny,
  type DzienRozkladuPrzystanku,
  type KursRozkladuRecznego,
  type RozkladPrzystankuReczny,
} from "@/lib/transport/rozklad-przystanku-reczny";

export type PrzystanekDoRozkladu = {
  id: string;
  name: string;
  photoUrl: string | null;
  photoCaption: string | null;
  rozklad: RozkladPrzystankuReczny | null;
};

const ETYKIETY_DNI: Record<DzienRozkladuPrzystanku, string> = {
  pn: "pn",
  wt: "wt",
  sr: "śr",
  cz: "cz",
  pt: "pt",
  sb: "sb",
  nd: "nd",
  robocze: "pn–pt",
  codziennie: "codz.",
};

function pustyRozklad(): RozkladPrzystankuReczny {
  return { wersja: 1, kursy: [], notatka: null, linkPdf: null, zaktualizowano: null };
}

export function EdytorRozkladuPrzystankuSoltys({
  villageId,
  przystanki,
}: {
  villageId: string;
  przystanki: PrzystanekDoRozkladu[];
}) {
  if (przystanki.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Brak przystanków na mapie — najpierw zaimportuj POI z OpenStreetMap (przycisk powyżej).
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-4">
      {przystanki.map((p) => (
        <li key={p.id}>
          <KartaPrzystanku villageId={villageId} przystanek={p} />
        </li>
      ))}
    </ul>
  );
}

function KartaPrzystanku({ villageId, przystanek }: { villageId: string; przystanek: PrzystanekDoRozkladu }) {
  const start = przystanek.rozklad ?? pustyRozklad();
  const [rozklad, ustawRozklad] = useState<RozkladPrzystankuReczny>(start);
  const [photoUrl, ustawPhotoUrl] = useState(przystanek.photoUrl);
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);
  const [czek, startT] = useTransition();

  function zapiszRozklad(e: FormEvent) {
    e.preventDefault();
    ustawBlad("");
    ustawOk(false);
    startT(async () => {
      const w = await zapiszRozkladPrzystankuSoltysa({ poiId: przystanek.id, rozklad });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOk(true);
    });
  }

  async function wgrajZdjecie(plik: File) {
    ustawBlad("");
    if (plik.size > 5 * 1024 * 1024) {
      ustawBlad("Zdjęcie max 5 MB.");
      return;
    }
    let publicUrl: string;
    let sciezka: string;

    if (czyKlientUzywaMagazynuR2()) {
      const uploadFd = new FormData();
      uploadFd.set("typ", "village_photos");
      uploadFd.set("villageId", villageId);
      uploadFd.set("podkatalog", "poi-rozklad");
      uploadFd.set("file", plik);
      const w = await wgrajObrazDoMagazynuR2(uploadFd);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      publicUrl = w.publicUrl;
      sciezka = publicUrl.split("/").slice(-3).join("/");
    } else {
      const supabase = utworzKlientaSupabasePrzegladarka();
      const ext = plik.name.split(".").pop()?.toLowerCase() || "jpg";
      sciezka = `${villageId}/poi-rozklad/${crypto.randomUUID()}.${ext}`;
      const { error: uE } = await supabase.storage.from("village_photos").upload(sciezka, plik, {
        upsert: false,
        contentType: plik.type || "image/jpeg",
      });
      if (uE) {
        ustawBlad("Nie udało się wgrać zdjęcia.");
        return;
      }
      const {
        data: { publicUrl: urlSupa },
      } = supabase.storage.from("village_photos").getPublicUrl(sciezka);
      publicUrl = urlSupa;
    }

    const w = await aktualizujZdjecieTabliczkiPrzystanku({
      poiId: przystanek.id,
      photoUrl: publicUrl,
      photoPath: sciezka,
      photoCaption: "Zdjęcie tabliczki rozkładu",
    });
    if ("blad" in w) {
      ustawBlad(w.blad);
      return;
    }
    ustawPhotoUrl(publicUrl);
    ustawOk(true);
  }

  function aktualizujKurs(idx: number, patch: Partial<KursRozkladuRecznego>) {
    ustawRozklad((r) => ({
      ...r,
      kursy: r.kursy.map((k, i) => (i === idx ? { ...k, ...patch } : k)),
    }));
  }

  function toggleDzien(idx: number, dzien: DzienRozkladuPrzystanku) {
    ustawRozklad((r) => ({
      ...r,
      kursy: r.kursy.map((k, i) => {
        if (i !== idx) return k;
        const ma = k.dni.includes(dzien);
        const dni = ma ? k.dni.filter((d) => d !== dzien) : [...k.dni, dzien];
        return { ...k, dni: dni.length ? dni : (["robocze"] as DzienRozkladuPrzystanku[]) };
      }),
    }));
  }

  return (
    <article className="rounded-xl border border-sky-200/90 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h5 className="font-medium text-sky-950">{przystanek.name}</h5>
          <p className="text-xs text-stone-500">Ręczny rozkład ma pierwszeństwo przed automatycznym cache PKS.</p>
        </div>
        {ok ? <span className="text-xs font-medium text-emerald-800">Zapisano ✓</span> : null}
      </div>

      {blad ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="mt-3 grid gap-4 lg:grid-cols-[140px_1fr]">
        <div>
          <p className="text-xs font-medium text-stone-600">Zdjęcie tabliczki</p>
          {photoUrl ? (
            <div className="relative mt-1 aspect-[3/4] w-full max-w-[140px] overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              <Image src={photoUrl} alt="Tabliczka rozkładu" fill className="object-cover" sizes="140px" />
            </div>
          ) : (
            <p className="mt-1 text-xs text-stone-500">Brak zdjęcia</p>
          )}
          <label className="mt-2 block text-xs">
            <span className="sr-only">Wgraj zdjęcie tabliczki</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={czek}
              className="block w-full max-w-xs text-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) startT(() => wgrajZdjecie(f));
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <form onSubmit={zapiszRozklad} className="space-y-3">
          <label className="block text-sm">
            Notatka / rozkład tekstowy
            <textarea
              rows={2}
              maxLength={1200}
              value={rozklad.notatka ?? ""}
              onChange={(e) => ustawRozklad((r) => ({ ...r, notatka: e.target.value || null }))}
              placeholder="np. Rano 6:45 i 8:10 do Olsztyna · wieczorem ostatni 17:30"
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            Link do PDF rozkładu (opcjonalnie)
            <input
              type="url"
              value={rozklad.linkPdf ?? ""}
              onChange={(e) => ustawRozklad((r) => ({ ...r, linkPdf: e.target.value.trim() || null }))}
              placeholder="https://…"
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
          </label>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Kursy (godziny)</p>
              <button
                type="button"
                onClick={() => ustawRozklad((r) => ({ ...r, kursy: [...r.kursy, nowyKursRozkladu()] }))}
                className="rounded-md border border-stone-300 bg-stone-50 px-2 py-1 text-xs font-medium"
              >
                + Kurs
              </button>
            </div>

            {rozklad.kursy.length === 0 ? (
              <p className="text-xs text-stone-500">Dodaj kursy albo wpisz samą notatkę tekstową powyżej.</p>
            ) : (
              rozklad.kursy.map((k, idx) => (
                <div key={k.id} className="rounded-lg border border-stone-200 bg-stone-50/80 p-3">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-xs">
                      Odjazd *
                      <input
                        type="time"
                        required
                        value={k.odjazd}
                        onChange={(e) => aktualizujKurs(idx, { odjazd: e.target.value.slice(0, 5) })}
                        className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                      />
                    </label>
                    <label className="text-xs">
                      Przyjazd
                      <input
                        type="time"
                        value={k.przyjazd ?? ""}
                        onChange={(e) =>
                          aktualizujKurs(idx, { przyjazd: e.target.value ? e.target.value.slice(0, 5) : null })
                        }
                        className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                      />
                    </label>
                    <label className="text-xs sm:col-span-2">
                      Kierunek *
                      <input
                        required
                        value={k.kierunek}
                        onChange={(e) => aktualizujKurs(idx, { kierunek: e.target.value })}
                        placeholder="np. Olsztyn"
                        maxLength={120}
                        className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                      />
                    </label>
                    <label className="text-xs">
                      Linia
                      <input
                        value={k.linia ?? ""}
                        onChange={(e) => aktualizujKurs(idx, { linia: e.target.value || null })}
                        placeholder="PKS 142"
                        maxLength={40}
                        className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                      />
                    </label>
                    <label className="text-xs sm:col-span-2">
                      Przez (opcjonalnie)
                      <input
                        value={k.przez ?? ""}
                        onChange={(e) => aktualizujKurs(idx, { przez: e.target.value || null })}
                        placeholder="Reszel, Biskupiec"
                        maxLength={200}
                        className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                      />
                    </label>
                    <label className="text-xs sm:col-span-2">
                      Uwagi
                      <input
                        value={k.uwagi ?? ""}
                        onChange={(e) => aktualizujKurs(idx, { uwagi: e.target.value || null })}
                        placeholder="Tylko w dni robocze szkolne"
                        maxLength={200}
                        className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dniRozkladuPrzystanku.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDzien(idx, d)}
                        className={
                          k.dni.includes(d)
                            ? "rounded-full bg-sky-800 px-2 py-0.5 text-[10px] font-medium text-white"
                            : "rounded-full border border-stone-300 bg-white px-2 py-0.5 text-[10px] text-stone-600"
                        }
                      >
                        {ETYKIETY_DNI[d]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => ustawRozklad((r) => ({ ...r, kursy: r.kursy.filter((_, i) => i !== idx) }))}
                    className="mt-2 text-xs text-red-700 underline"
                  >
                    Usuń kurs
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={czek}
              className="rounded-lg bg-sky-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {czek ? "Zapisuję…" : "Zapisz rozkład"}
            </button>
            {przystanek.rozklad ? (
              <button
                type="button"
                disabled={czek}
                onClick={() => {
                  if (!window.confirm("Usunąć cały ręczny rozkład tego przystanku?")) return;
                  startT(async () => {
                    const w = await usunRecznyRozkladPrzystanku(przystanek.id);
                    if ("blad" in w) ustawBlad(w.blad);
                    else {
                      ustawRozklad(pustyRozklad());
                      ustawOk(true);
                    }
                  });
                }}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-800"
              >
                Wyczyść rozkład
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </article>
  );
}

export function mapujPrzystanekDoRozkladu(row: {
  id: string;
  name: string;
  photo_url?: string | null;
  photo_caption?: string | null;
  bus_schedule_manual?: unknown;
}): PrzystanekDoRozkladu {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url ?? null,
    photoCaption: row.photo_caption ?? null,
    rozklad: parsujRozkladPrzystankuReczny(row.bus_schedule_manual),
  };
}
