"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dodajAktywnoscFitness,
  edytujAktywnoscFitness,
  usunAktywnoscFitness,
} from "@/app/(site)/wies/akcje-aktywnosc-fitness";
import { parsujGpx } from "@/lib/wies/parse-gpx";
import { KARTA_LISTY_WIES } from "@/components/wies/oslona-sekcji-wies";
import { PrzyciskLadowania } from "@/components/ui/przycisk-ladowania";
import {
  etykietaRodzajuAktywnosci,
  formatujCzas,
  formatujDystans,
  type AktywnoscFitnessPubliczna,
  type PodsumowanieAktywnosciFitness,
} from "@/lib/wies/pobierz-aktywnosci-fitness-wsi";
import type { RodzajAktywnosci } from "@/lib/wies/wywnioskuj-rodzaj-aktywnosci";
import { wywnioskujRodzajAktywnosci } from "@/lib/wies/wywnioskuj-rodzaj-aktywnosci";

type KlubOpcja = { id: string; name: string };
type FiltrAktywnosci = "wszystkie" | "bieg" | "nordic_walking" | "rower" | "turystyka";

type PropsFormularz = {
  villageId: string;
  zalogowany: boolean;
  mieszkaniecWsi: boolean;
  kluby: KlubOpcja[];
};

function domyslnaData() {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dataDoInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return domyslnaData();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PodsumowanieAktywnosciFitness({ podsumowanie }: { podsumowanie: PodsumowanieAktywnosciFitness | null }) {
  if (!podsumowanie || podsumowanie.liczbaAktywnosci === 0) return null;

  const miesiac = new Date().toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
  const dystans = formatujDystans(podsumowanie.lacznyDystansMetrow);

  return (
    <div className="mt-6 rounded-xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 to-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">Ten miesiąc ({miesiac})</p>
      <p className="mt-1 text-sm text-stone-800">
        <strong>{podsumowanie.liczbaAktywnosci}</strong>{" "}
        {podsumowanie.liczbaAktywnosci === 1 ? "aktywność" : "aktywności"}
        {podsumowanie.uczestnikow > 0 ? (
          <>
            {" "}
            · <strong>{podsumowanie.uczestnikow}</strong>{" "}
            {podsumowanie.uczestnikow === 1 ? "osoba" : "osób"}
          </>
        ) : null}
        {dystans ? (
          <>
            {" "}
            · łącznie <strong>{dystans}</strong>
          </>
        ) : null}
      </p>
    </div>
  );
}

export function FormularzAktywnosciFitnessKlient({ villageId, zalogowany, mieszkaniecWsi, kluby }: PropsFormularz) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState(false);
  const [oczekuje, startT] = useTransition();
  const [trybImportu, ustawTrybImportu] = useState<"reczny" | "gpx">("reczny");
  const [podgladGpx, ustawPodgladGpx] = useState<{ dystans: string | null; czas: string | null; tytul: string | null } | null>(
    null,
  );
  const [gpxXml, ustawGpxXml] = useState<string | null>(null);
  const [rodzajAktywnosci, ustawRodzajAktywnosci] = useState<RodzajAktywnosci>("bieg");
  const [tytulReczny, ustawTytulReczny] = useState("");

  if (!zalogowany) {
    return (
      <p className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-950">
        <a href="/logowanie" className="font-medium underline">
          Zaloguj się
        </a>
        , aby dodać swoją aktywność (bieg, nordic walking, rower…).
      </p>
    );
  }

  if (!mieszkaniecWsi) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950">
        Aktywności mogą dodawać mieszkańcy z aktywną rolą we wsi.{" "}
        <a href="/panel/mieszkaniec" className="font-medium underline">
          Złóż wniosek w panelu mieszkańca
        </a>
        .
      </p>
    );
  }

  function onPlikGpx(e: React.ChangeEvent<HTMLInputElement>) {
    const plik = e.target.files?.[0];
    if (!plik) {
      ustawGpxXml(null);
      ustawPodgladGpx(null);
      return;
    }
    if (plik.size > 2 * 1024 * 1024) {
      ustawBlad("Plik GPX jest za duży (max 2 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result ?? "");
      ustawGpxXml(txt);
      const p = parsujGpx(txt);
      ustawPodgladGpx({
        dystans: p.distanceMeters ? `${(p.distanceMeters / 1000).toFixed(2)} km` : null,
        czas: p.durationSeconds ? `${Math.floor(p.durationSeconds / 60)} min` : null,
        tytul: p.title,
      });
      if (p.title) ustawTytulReczny(p.title);
      const wnioskowany = wywnioskujRodzajAktywnosci(p.title ?? plik.name);
      if (wnioskowany) ustawRodzajAktywnosci(wnioskowany);
    };
    reader.readAsText(plik);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawSukces(false);
    const fd = new FormData(e.currentTarget);

    startT(async () => {
      const w = await dodajAktywnoscFitness({
        villageId,
        group_id: String(fd.get("group_id") ?? "") || null,
        activity_kind: rodzajAktywnosci,
        title: String(fd.get("title") ?? "").trim(),
        activity_date: String(fd.get("activity_date") ?? ""),
        duration_seconds: fd.get("duration_minutes")
          ? Number(fd.get("duration_minutes")) * 60
          : null,
        distance_meters: fd.get("distance_km") ? Math.round(Number(fd.get("distance_km")) * 1000) : null,
        strava_url: null,
        notes: String(fd.get("notes") ?? "") || null,
        gpx_xml: trybImportu === "gpx" ? gpxXml : null,
      });

      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawSukces(true);
      ustawGpxXml(null);
      ustawPodgladGpx(null);
      ustawTytulReczny("");
      ustawRodzajAktywnosci("bieg");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-sky-200/80 bg-white/90 p-4">
      <h3 className="text-sm font-semibold text-sky-950">Dodaj swoją aktywność</h3>
      <p className="mt-1 text-xs text-stone-600">
        Podziel się treningiem — wpisz ręcznie albo zaimportuj plik GPX z zegarka lub aplikacji.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["reczny", "gpx"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => ustawTrybImportu(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              trybImportu === t ? "bg-sky-800 text-white" : "border border-stone-300 bg-white text-stone-700"
            }`}
          >
            {t === "reczny" ? "Ręcznie" : "Import GPX"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          name="activity_kind"
          required
          value={rodzajAktywnosci}
          onChange={(e) => ustawRodzajAktywnosci(e.target.value as RodzajAktywnosci)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="bieg">Bieg</option>
          <option value="nordic_walking">Nordic walking</option>
          <option value="rower">Rower</option>
          <option value="turystyka">Turystyka / wędrówka</option>
          <option value="inne">Inne</option>
        </select>
        {kluby.length > 0 ? (
          <select name="group_id" className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="">— bez klubu —</option>
            {kluby.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        ) : null}
        <input
          name="title"
          required
          value={tytulReczny}
          onChange={(e) => ustawTytulReczny(e.target.value)}
          placeholder="Tytuł (np. Poranny bieg wokół stawu)"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <label className="text-xs text-stone-600 sm:col-span-2">
          Data i godzina
          <input
            name="activity_date"
            type="datetime-local"
            required
            defaultValue={domyslnaData()}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>

        {trybImportu === "gpx" ? (
          <label className="text-xs text-stone-600 sm:col-span-2">
            Plik GPX
            <input type="file" accept=".gpx,application/gpx+xml" onChange={onPlikGpx} className="mt-1 block w-full text-sm" />
            {podgladGpx ? (
              <span className="mt-1 block text-sky-800">
                {podgladGpx.tytul ? `Tytuł z pliku: ${podgladGpx.tytul}` : ""}
                {podgladGpx.dystans ? `${podgladGpx.tytul ? " · " : ""}Dystans: ${podgladGpx.dystans}` : ""}
                {podgladGpx.czas ? ` · Czas: ${podgladGpx.czas}` : ""}
              </span>
            ) : null}
          </label>
        ) : null}

        {trybImportu === "reczny" ? (
          <>
            <label className="text-xs text-stone-600">
              Dystans (km, opcjonalnie)
              <input name="distance_km" type="number" step="0.01" min="0" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs text-stone-600">
              Czas (min, opcjonalnie)
              <input name="duration_minutes" type="number" min="1" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            </label>
          </>
        ) : null}

        <textarea
          name="notes"
          rows={2}
          placeholder="Krótki opis trasy (opcjonalnie)"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
      </div>

      <div className="mt-4">
        <PrzyciskLadowania type="submit" laduje={oczekuje} tekst="Opublikuj aktywność" tekstLadowania="Zapisuję…" />
      </div>

      {sukces ? <p className="mt-2 text-sm text-green-800">Dodano aktywność — dziękujemy!</p> : null}
      {blad ? <p className="mt-2 text-sm text-red-700">{blad}</p> : null}
    </form>
  );
}

type ListaProps = {
  aktywnosci: AktywnoscFitnessPubliczna[];
  villageId: string;
  biezacyUserId?: string | null;
};

function FormularzEdycjiAktywnosci({
  aktywnosc,
  villageId,
  onAnuluj,
  onZapisano,
}: {
  aktywnosc: AktywnoscFitnessPubliczna;
  villageId: string;
  onAnuluj: () => void;
  onZapisano: () => void;
}) {
  const [blad, ustawBlad] = useState("");
  const [oczekuje, startT] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await edytujAktywnoscFitness({
        id: aktywnosc.id,
        villageId,
        activity_kind: String(fd.get("activity_kind") ?? "inne") as RodzajAktywnosci,
        title: String(fd.get("title") ?? "").trim(),
        activity_date: String(fd.get("activity_date") ?? ""),
        duration_seconds: fd.get("duration_minutes")
          ? Number(fd.get("duration_minutes")) * 60
          : null,
        distance_meters: fd.get("distance_km") ? Math.round(Number(fd.get("distance_km")) * 1000) : null,
        notes: String(fd.get("notes") ?? "") || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      onZapisano();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 rounded-lg border border-sky-300 bg-white p-3">
      <p className="text-xs font-semibold text-sky-900">Edycja wpisu</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <select
          name="activity_kind"
          defaultValue={aktywnosc.activity_kind}
          className="rounded border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="bieg">Bieg</option>
          <option value="nordic_walking">Nordic walking</option>
          <option value="rower">Rower</option>
          <option value="turystyka">Turystyka</option>
          <option value="inne">Inne</option>
        </select>
        <input
          name="title"
          required
          defaultValue={aktywnosc.title}
          className="rounded border border-stone-300 px-2 py-1.5 text-sm sm:col-span-2"
        />
        <input
          name="activity_date"
          type="datetime-local"
          required
          defaultValue={dataDoInput(aktywnosc.activity_date)}
          className="rounded border border-stone-300 px-2 py-1.5 text-sm sm:col-span-2"
        />
        <label className="text-xs text-stone-600">
          Dystans (km)
          <input
            name="distance_km"
            type="number"
            step="0.01"
            min="0"
            defaultValue={aktywnosc.distance_meters ? (aktywnosc.distance_meters / 1000).toFixed(2) : ""}
            className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-stone-600">
          Czas (min)
          <input
            name="duration_minutes"
            type="number"
            min="1"
            defaultValue={aktywnosc.duration_seconds ? Math.round(aktywnosc.duration_seconds / 60) : ""}
            className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
          />
        </label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={aktywnosc.notes ?? ""}
          className="rounded border border-stone-300 px-2 py-1.5 text-sm sm:col-span-2"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="submit" disabled={oczekuje} className="rounded bg-sky-800 px-3 py-1 text-xs text-white disabled:opacity-50">
          {oczekuje ? "Zapisuję…" : "Zapisz"}
        </button>
        <button type="button" onClick={onAnuluj} className="text-xs text-stone-600 underline">
          Anuluj
        </button>
      </div>
      {blad ? <p className="mt-1 text-xs text-red-700">{blad}</p> : null}
    </form>
  );
}

export function ListaAktywnosciFitness({ aktywnosci, villageId, biezacyUserId = null }: ListaProps) {
  const router = useRouter();
  const [filtr, ustawFiltr] = useState<FiltrAktywnosci>("wszystkie");
  const [edytowanyId, ustawEdytowanyId] = useState<string | null>(null);
  const [pending, startT] = useTransition();

  const lista = useMemo(() => {
    if (filtr === "wszystkie") return aktywnosci;
    return aktywnosci.filter((a) => a.activity_kind === filtr);
  }, [aktywnosci, filtr]);

  if (aktywnosci.length === 0) return null;

  const filtrBtn = (id: FiltrAktywnosci, label: string) => (
    <button
      type="button"
      onClick={() => ustawFiltr(id)}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        filtr === id ? "bg-sky-800 text-white" : "border border-stone-300 bg-white text-stone-700"
      }`}
    >
      {label}
    </button>
  );

  function usun(id: string) {
    if (!confirm("Usunąć ten wpis?")) return;
    startT(async () => {
      const w = await usunAktywnoscFitness(id, villageId);
      if ("ok" in w && w.ok) router.refresh();
    });
  }

  return (
    <div className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">Aktywni we wsi</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {filtrBtn("wszystkie", "Wszystkie")}
        {filtrBtn("bieg", "Bieg")}
        {filtrBtn("nordic_walking", "Nordic walking")}
        {filtrBtn("rower", "Rower")}
        {filtrBtn("turystyka", "Turystyka")}
      </div>
      {lista.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Brak aktywności w tym filtrze.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lista.map((a) => {
            const meta = [formatujDystans(a.distance_meters), formatujCzas(a.duration_seconds)]
              .filter(Boolean)
              .join(" · ");
            const wlasny = biezacyUserId && a.autor?.id === biezacyUserId;

            return (
              <li key={a.id} className={`${KARTA_LISTY_WIES} border-sky-200/70 bg-sky-50/30`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-sky-800">
                      {etykietaRodzajuAktywnosci(a.activity_kind)}
                      {a.nazwa_klubu ? ` · ${a.nazwa_klubu}` : ""}
                      {a.source === "gpx" ? " · GPX" : ""}
                    </p>
                    <p className="mt-1 font-medium text-stone-900">{a.title}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      {new Date(a.activity_date).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                      {meta ? ` · ${meta}` : ""}
                      {a.autor?.display_name ? ` · ${a.autor.display_name}` : ""}
                    </p>
                    {a.notes ? <p className="mt-1 text-xs text-stone-600">{a.notes}</p> : null}
                  </div>
                  {wlasny ? (
                    <div className="flex shrink-0 gap-2 text-xs">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => ustawEdytowanyId(edytowanyId === a.id ? null : a.id)}
                        className="text-sky-800 underline hover:text-sky-950 disabled:opacity-50"
                      >
                        {edytowanyId === a.id ? "Zwiń" : "Edytuj"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => usun(a.id)}
                        className="text-stone-500 underline hover:text-red-700 disabled:opacity-50"
                      >
                        Usuń
                      </button>
                    </div>
                  ) : null}
                </div>
                {wlasny && edytowanyId === a.id ? (
                  <FormularzEdycjiAktywnosci
                    aktywnosc={a}
                    villageId={villageId}
                    onAnuluj={() => ustawEdytowanyId(null)}
                    onZapisano={() => {
                      ustawEdytowanyId(null);
                      router.refresh();
                    }}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
