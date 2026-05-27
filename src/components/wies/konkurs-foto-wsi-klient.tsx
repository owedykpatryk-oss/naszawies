"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { glosujWKonkursieFoto } from "@/app/(site)/panel/mieszkaniec/akcje-konkurs-foto";
import {
  czyMoznaGlosowac,
  czyMoznaZglaszac,
  etykietaFazyKonkursu,
  formatujZakresDat,
  type KonkursFotoPubliczny,
  type ZdjecieKonkursu,
} from "@/lib/konkurs-foto/fazy-konkursu";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

type Props = {
  konkurs: KonkursFotoPubliczny;
  zdjecia: ZdjecieKonkursu[];
  mojGlosPhotoId: string | null;
  zalogowany: boolean;
  nazwaWsi: string;
  sciezkaPaneluFoto: string;
};

export function KonkursFotoWsiKlient({
  konkurs,
  zdjecia,
  mojGlosPhotoId: poczatkowyGlos,
  zalogowany,
  nazwaWsi,
  sciezkaPaneluFoto,
}: Props) {
  const router = useRouter();
  const [mojGlos, ustawMojGlos] = useState(poczatkowyGlos);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  const faza = etykietaFazyKonkursu(konkurs.status);
  const zglaszanie = czyMoznaZglaszac(konkurs);
  const glosowanie = czyMoznaGlosowac(konkurs);
  const zwyciezca = konkurs.winnerPhotoId
    ? zdjecia.find((z) => z.id === konkurs.winnerPhotoId)
    : zdjecia[0];

  function oddajGlos(photoId: string) {
    ustawBlad("");
    startT(async () => {
      const w = await glosujWKonkursieFoto({ contestId: konkurs.id, photoId });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawMojGlos(photoId);
      router.refresh();
    });
  }

  return (
    <OslonaSekcjiWies id="konkurs-foto-wsi">
      <TytulSekcjiWies
        etykieta="Konkurs"
        tytul={konkurs.title}
        opis={
          konkurs.description ??
          `Najlepsze zdjęcia ${nazwaWsi} — głosują mieszkańcy i obserwujący wieś. Faza: ${faza}.`
        }
      />
      <p className="mt-2">
        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-950">
          {faza}
        </span>
      </p>

      {konkurs.rulesText ? (
        <p className="mt-3 rounded-xl border border-stone-200/80 bg-white/80 p-3 text-sm text-stone-600 whitespace-pre-wrap">
          {konkurs.rulesText}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-stone-800">Zgłoszenia</dt>
          <dd>{formatujZakresDat(konkurs.submissionsStart, konkurs.submissionsEnd)}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-800">Głosowanie</dt>
          <dd>{formatujZakresDat(konkurs.votingStart, konkurs.votingEnd)}</dd>
        </div>
      </dl>

      {zglaszanie ? (
        <p className="mt-4 rounded-xl border border-green-200/80 bg-green-50/60 p-3 text-sm text-green-950">
          Trwa zgłaszanie zdjęć (max {konkurs.maxEntriesPerUser} na osobę).{" "}
          <Link href={sciezkaPaneluFoto} className="font-medium underline">
            Dodaj zdjęcie w fotokronice →
          </Link>
        </p>
      ) : null}

      {konkurs.status === "closed" && zwyciezca ? (
        <div className="mt-6 overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 p-4 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Zwycięzca</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl bg-stone-100">
              <img
                src={zwyciezca.url}
                alt={zwyciezca.caption ?? "Zdjęcie zwycięzcy"}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-serif text-lg text-green-950">
                {zwyciezca.caption ?? "Zdjęcie bez opisu"}
              </p>
              <p className="mt-1 text-sm text-stone-600">{zwyciezca.voteCount} głosów</p>
            </div>
          </div>
        </div>
      ) : null}

      {glosowanie && zdjecia.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm text-stone-600">
            {zalogowany
              ? "Oddaj jeden głos na ulubione zdjęcie. Możesz zmienić wybór do końca głosowania."
              : "Zaloguj się lub obserwuj wieś, aby głosować."}
          </p>
          {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zdjecia.map((z) => {
              const wybrane = mojGlos === z.id;
              return (
                <li
                  key={z.id}
                  className={`karta-wow overflow-hidden rounded-2xl ${wybrane ? "ring-2 ring-green-700" : ""}`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                    <img
                      src={z.url}
                      alt={z.caption ?? "Zdjęcie konkursowe"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    {z.caption ? <p className="line-clamp-2 text-sm text-stone-800">{z.caption}</p> : null}
                    <p className="mt-1 text-xs font-medium text-emerald-900">{z.voteCount} głosów</p>
                    {zalogowany ? (
                      <button
                        type="button"
                        disabled={czek}
                        onClick={() => oddajGlos(z.id)}
                        className={
                          wybrane
                            ? "btn-panel-primary mt-3 w-full"
                            : "btn-panel-secondary mt-3 w-full"
                        }
                      >
                        {wybrane ? "Twój głos ✓" : "Głosuj"}
                      </button>
                    ) : (
                      <Link href="/logowanie" className="btn-panel-secondary mt-3 inline-flex w-full justify-center">
                        Zaloguj się, by głosować
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {konkurs.status === "voting" && zdjecia.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          Głosowanie wkrótce — sołtys zatwierdza zgłoszone zdjęcia w fotokronice.
        </p>
      ) : null}

      {konkurs.status === "submissions" ? (
        <p className="mt-4 text-xs text-stone-500">
          Po zakończeniu zgłoszeń sołtys zatwierdzi zdjęcia, a następnie otworzy głosowanie na tej stronie.
        </p>
      ) : null}
    </OslonaSekcjiWies>
  );
}
