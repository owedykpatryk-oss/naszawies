"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  zmienStatusKonkursuFotoSoltys,
  utworzKonkursFotoSoltys,
} from "../akcje-konkurs-foto";
import { etykietaFazyKonkursu, formatujZakresDat, type StatusKonkursuFoto } from "@/lib/konkurs-foto/fazy-konkursu";

export type WierszKonkursuSoltys = {
  id: string;
  villageId: string;
  wiesNazwa: string;
  title: string;
  status: StatusKonkursuFoto;
  submissionsStart: string;
  submissionsEnd: string;
  votingStart: string;
  votingEnd: string;
  maxEntriesPerUser: number;
  liczbaZgloszen: number;
  liczbaZatwierdzonych: number;
  winnerPhotoId: string | null;
};

type Props = {
  wsie: { id: string; name: string }[];
  konkursy: WierszKonkursuSoltys[];
};

export function KonkursySoltysKlient({ wsie, konkursy: poczatkowe }: Props) {
  const [konkursy, ustawKonkursy] = useState(poczatkowe);
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  function onUtworz(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawKomunikat("");
    const fd = new FormData(e.currentTarget);
    const villageId = String(fd.get("village_id") || "");
    const title = String(fd.get("title") || "").trim();
    const submissionsEnd = String(fd.get("submissions_end") || "");
    const votingStart = String(fd.get("voting_start") || "");
    const votingEnd = String(fd.get("voting_end") || "");
    const maxEntries = Number(fd.get("max_entries") || 3);

    startT(async () => {
      const w = await utworzKonkursFotoSoltys({
        villageId,
        title,
        description: String(fd.get("description") || "").trim() || null,
        rulesText: String(fd.get("rules_text") || "").trim() || null,
        submissionsEnd,
        votingStart,
        votingEnd,
        maxEntriesPerUser: maxEntries,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Konkurs utworzony jako szkic — opublikuj zgłoszenia, gdy będziesz gotowy.");
      e.currentTarget.reset();
      window.location.reload();
    });
  }

  function zmienStatus(contestId: string, status: StatusKonkursuFoto) {
    ustawBlad("");
    startT(async () => {
      const w = await zmienStatusKonkursuFotoSoltys({ contestId, status });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKonkursy((prev) => prev.map((k) => (k.id === contestId ? { ...k, status } : k)));
      ustawKomunikat("Status zaktualizowany.");
    });
  }

  return (
    <div className="space-y-8">
      {komunikat ? <p className="rounded-lg bg-green-50 p-3 text-sm text-green-950">{komunikat}</p> : null}
      {blad ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{blad}</p> : null}

      <section className="soltys-sekcja forms-premium">
        <h2 className="font-serif text-lg text-green-950">Nowy konkurs zdjęć</h2>
        <p className="mt-1 text-sm text-stone-600">
          Mieszkańcy zgłaszają zdjęcia w fotokronice; Ty zatwierdzasz, potem otwierasz głosowanie na profilu wsi.
        </p>
        <form onSubmit={onUtworz} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            Wieś
            <select name="village_id" required className="form-control mt-1">
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            Tytuł konkursu
            <input name="title" required maxLength={120} placeholder="np. Najpiękniejsze zdjęcie naszej wsi 2026" className="form-control mt-1" />
          </label>
          <label className="block sm:col-span-2">
            Opis (krótko)
            <textarea name="description" rows={2} className="form-control mt-1" />
          </label>
          <label className="block sm:col-span-2">
            Regulamin / zasady
            <textarea name="rules_text" rows={3} placeholder="Temat, co wolno fotografować, prawa autorskie…" className="form-control mt-1" />
          </label>
          <label>
            Koniec zgłoszeń
            <input type="datetime-local" name="submissions_end" required className="form-control mt-1" />
          </label>
          <label>
            Max zdjęć / osoba
            <input type="number" name="max_entries" min={1} max={20} defaultValue={3} className="form-control mt-1" />
          </label>
          <label>
            Start głosowania
            <input type="datetime-local" name="voting_start" required className="form-control mt-1" />
          </label>
          <label>
            Koniec głosowania
            <input type="datetime-local" name="voting_end" required className="form-control mt-1" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={czek || wsie.length === 0} className="btn-panel-primary">
              Utwórz szkic konkursu
            </button>
          </div>
        </form>
      </section>

      <section className="soltys-sekcja">
        <h2 className="font-serif text-lg text-green-950">Twoje konkursy</h2>
        {konkursy.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Brak konkursów — utwórz pierwszy powyżej.</p>
        ) : (
          <ul className="soltys-lista-moderacji mt-4">
            {konkursy.map((k) => (
              <li key={k.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-stone-500">{k.wiesNazwa}</p>
                    <p className="font-medium text-stone-900">{k.title}</p>
                    <p className="mt-1 text-xs text-emerald-900">{etykietaFazyKonkursu(k.status)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {k.status === "draft" ? (
                      <button
                        type="button"
                        className="btn-panel-primary text-xs"
                        disabled={czek}
                        onClick={() => zmienStatus(k.id, "submissions")}
                      >
                        Otwórz zgłoszenia
                      </button>
                    ) : null}
                    {k.status === "submissions" ? (
                      <button
                        type="button"
                        className="btn-panel-secondary text-xs"
                        disabled={czek}
                        onClick={() => zmienStatus(k.id, "voting")}
                      >
                        Start głosowania
                      </button>
                    ) : null}
                    {k.status === "voting" ? (
                      <button
                        type="button"
                        className="btn-panel-primary text-xs"
                        disabled={czek}
                        onClick={() => zmienStatus(k.id, "closed")}
                      >
                        Zakończ i pokaż wyniki
                      </button>
                    ) : null}
                    {k.status !== "cancelled" && k.status !== "closed" ? (
                      <button
                        type="button"
                        className="btn-panel-danger text-xs"
                        disabled={czek}
                        onClick={() => zmienStatus(k.id, "cancelled")}
                      >
                        Anuluj
                      </button>
                    ) : null}
                  </div>
                </div>
                <dl className="mt-3 grid gap-1 text-xs text-stone-600 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium">Zgłoszenia</dt>
                    <dd>{formatujZakresDat(k.submissionsStart, k.submissionsEnd)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Głosowanie</dt>
                    <dd>{formatujZakresDat(k.votingStart, k.votingEnd)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Zgłoszone zdjęcia</dt>
                    <dd>
                      {k.liczbaZgloszen} (zatwierdzone: {k.liczbaZatwierdzonych})
                    </dd>
                  </div>
                </dl>
                {k.status === "submissions" || k.status === "voting" ? (
                  <p className="mt-2 text-xs text-stone-500">
                    Zatwierdzaj zdjęcia w{" "}
                    <a href="/panel/soltys/fotokronika" className="link-panel">
                      fotokronice
                    </a>
                    .
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
