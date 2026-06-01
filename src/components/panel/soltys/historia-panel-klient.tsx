"use client";

import Link from "next/link";
import { FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WgrajObrazWiesKlient } from "@/components/wies/wgraj-obraz-wies-klient";
import { KodyEmbedWsiKlient } from "@/components/wies/kody-embed-wsi-klient";
import { QrKronikaHistoriiKlient } from "@/components/wies/qr-kronika-historii-klient";
import {
  dodajWpisHistoriiWsi,
  edytujWpisHistoriiWsi,
  odrzucWpisHistoriiWsi,
  przelaczWyroznienieWpisuHistorii,
  usunWpisHistoriiWsi,
  zatwierdzWpisHistoriiWsi,
} from "@/lib/historia/akcje-historia";
import { urlRssHistoriiWsi } from "@/lib/historia/rss-historii";
import type { WpisHistoriiPanel } from "@/lib/historia/typy-historii";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type WiesRow = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

export function HistoriaPanelKlient({
  wsie,
  wpisyPoWsi,
}: {
  wsie: WiesRow[];
  wpisyPoWsi: Record<string, WpisHistoriiPanel[]>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [mediaUrls, ustawMediaUrls] = useState<string[]>([]);
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [edytowanyId, ustawEdytowanyId] = useState<string | null>(null);
  const [czek, startT] = useTransition();

  const wies = wsie.find((w) => w.id === villageId) ?? wsie[0];
  const wpisyWszystkie = wpisyPoWsi[villageId] ?? [];
  const oczekujace = wpisyWszystkie.filter((w) => w.status === "pending");
  const opublikowane = wpisyWszystkie.filter((w) => w.status === "approved");
  const sciezka = wies ? sciezkaProfiluWsi(wies) : "/";

  function wyczyscFormularz() {
    ustawEdytowanyId(null);
    ustawMediaUrls([]);
    formRef.current?.reset();
  }

  function rozpocznijEdycje(w: WpisHistoriiPanel) {
    ustawEdytowanyId(w.id);
    ustawMediaUrls([...w.media_urls]);
    ustawKomunikat("");
    ustawBlad("");
    if (!formRef.current) return;
    const f = formRef.current;
    (f.elements.namedItem("title") as HTMLInputElement).value = w.title;
    (f.elements.namedItem("short_description") as HTMLTextAreaElement).value = w.short_description ?? "";
    (f.elements.namedItem("body") as HTMLTextAreaElement).value = w.body ?? "";
    (f.elements.namedItem("event_date") as HTMLInputElement).value = w.event_date?.slice(0, 10) ?? "";
    (f.elements.namedItem("era_label") as HTMLInputElement).value = w.era_label ?? "";
    (f.elements.namedItem("location_label") as HTMLInputElement).value = w.location_label ?? "";
    (f.elements.namedItem("latitude") as HTMLInputElement).value =
      w.latitude != null ? String(w.latitude) : "";
    (f.elements.namedItem("longitude") as HTMLInputElement).value =
      w.longitude != null ? String(w.longitude) : "";
    (f.elements.namedItem("source_links_csv") as HTMLInputElement).value = w.source_links.join(", ");
  }

  function wyslij(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!wies) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      villageId: wies.id,
      title: String(fd.get("title") ?? ""),
      short_description: String(fd.get("short_description") ?? "") || null,
      body: String(fd.get("body") ?? ""),
      event_date: String(fd.get("event_date") ?? "") || null,
      era_label: String(fd.get("era_label") ?? "") || null,
      location_label: String(fd.get("location_label") ?? "") || null,
      latitude: String(fd.get("latitude") ?? ""),
      longitude: String(fd.get("longitude") ?? ""),
      source_links_csv: String(fd.get("source_links_csv") ?? ""),
      media_urls_csv: mediaUrls.join("\n"),
    };
    ustawBlad("");
    ustawKomunikat("");
    startT(async () => {
      const wynik = edytowanyId
        ? await edytujWpisHistoriiWsi({ ...payload, id: edytowanyId })
        : await dodajWpisHistoriiWsi(payload);
      if ("blad" in wynik && wynik.blad) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawKomunikat(edytowanyId ? "Zapisano zmiany." : "Dodano wpis historii.");
      wyczyscFormularz();
      router.refresh();
    });
  }

  function usun(id: string) {
    if (!wies || !confirm("Usunąć ten wpis historii?")) return;
    startT(async () => {
      const wynik = await usunWpisHistoriiWsi(wies.id, id);
      if ("blad" in wynik && wynik.blad) {
        ustawBlad(wynik.blad);
        return;
      }
      if (edytowanyId === id) wyczyscFormularz();
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {wsie.length > 1 ? (
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Wieś</span>
          <select
            value={villageId}
            onChange={(e) => {
              ustawVillageId(e.target.value);
              wyczyscFormularz();
            }}
            className="mt-1 w-full max-w-md rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {wies ? (
        <p className="rounded-lg border border-amber-200/70 bg-amber-50/40 px-3 py-2 text-sm text-stone-700">
          Mieszkańcy i goście widzą te wpisy na publicznym profilu (
          <Link href={`${sciezka}#sekcja-historia`} className="font-medium text-green-800 underline">
            zakładka Historia — {wies.name}
          </Link>
          ,{" "}
          <Link href={`${sciezka}/historia`} className="font-medium text-green-800 underline">
            pełna lista
          </Link>
          ). To nie zastępuje modułu{" "}
          <Link href="/panel/soltys/zgloszenia" className="font-medium text-green-800 underline">
            Zgłoszeń
          </Link>
          .
        </p>
      ) : null}

      {oczekujace.length > 0 ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50/60 p-4">
          <h2 className="font-semibold text-amber-950">
            Do akceptacji ({oczekujace.length})
          </h2>
          <p className="mt-1 text-xs text-stone-600">Wspomnienia zgłoszone przez mieszkańców w panelu mieszkańca.</p>
          <ul className="mt-4 space-y-3">
            {oczekujace.map((w) => (
              <li key={w.id} className="rounded-lg border border-amber-200 bg-white px-4 py-3">
                <p className="font-medium text-stone-900">{w.title}</p>
                {w.short_description ? <p className="mt-1 text-sm text-stone-600">{w.short_description}</p> : null}
                <p className="mt-2 line-clamp-3 text-xs text-stone-700">{w.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={czek}
                    className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    onClick={() => {
                      if (!wies) return;
                      startT(async () => {
                        const wynik = await zatwierdzWpisHistoriiWsi({ villageId: wies.id, id: w.id });
                        if ("blad" in wynik && wynik.blad) {
                          ustawBlad(wynik.blad);
                          return;
                        }
                        ustawKomunikat("Opublikowano wspomnienie.");
                        router.refresh();
                      });
                    }}
                  >
                    Zatwierdź i opublikuj
                  </button>
                  <button
                    type="button"
                    disabled={czek}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-800 disabled:opacity-60"
                    onClick={() => rozpocznijEdycje(w)}
                  >
                    Edytuj przed publikacją
                  </button>
                  <button
                    type="button"
                    disabled={czek}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-800 disabled:opacity-60"
                    onClick={() => {
                      if (!wies || !confirm("Odrzucić to wspomnienie?")) return;
                      startT(async () => {
                        const wynik = await odrzucWpisHistoriiWsi({ villageId: wies.id, id: w.id });
                        if ("blad" in wynik && wynik.blad) {
                          ustawBlad(wynik.blad);
                          return;
                        }
                        router.refresh();
                      });
                    }}
                  >
                    Odrzuć
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form ref={formRef} onSubmit={wyslij} className="space-y-4 rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 sm:p-5">
        <h2 className="font-semibold text-amber-950">{edytowanyId ? "Edycja wpisu" : "Nowy wpis historii"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            required
            placeholder="Tytuł (np. Pożar starej szkoły, 1972)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="era_label"
            placeholder="Epoka (np. PRL, II wojna światowa)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <input name="event_date" type="date" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <input
            name="location_label"
            placeholder="Miejsce (np. Rynek, stary kościół)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="latitude"
            placeholder="Szerokość (np. 52.1234)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="longitude"
            placeholder="Długość (np. 21.5678)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <p className="text-xs text-stone-500">
          Współrzędne opcjonalne — pojawią pinezkę na mapie w sekcji Historia. Możesz skopiować z{" "}
          <Link href="/mapa" className="text-green-800 underline">
            mapy katalogu
          </Link>
          .
        </p>
        <textarea
          name="short_description"
          rows={2}
          placeholder="Krótki lead (widoczny na liście)"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <textarea
          name="body"
          required
          rows={6}
          placeholder="Pełna treść — wspomnienia, cytaty, opis wydarzenia…"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="source_links_csv"
          placeholder="Linki źródeł (oddzielone przecinkami)"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />

        <div className="rounded-lg border border-stone-200 bg-white/80 p-3">
          <p className="text-xs font-medium text-stone-600">Zdjęcia ({mediaUrls.length}/12)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mediaUrls.map((url) => (
              <span key={url} className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 text-xs">
                <a href={url} target="_blank" rel="noopener noreferrer" className="max-w-[12rem] truncate text-green-800 underline">
                  podgląd
                </a>
                <button
                  type="button"
                  className="text-red-700"
                  onClick={() => ustawMediaUrls((prev) => prev.filter((u) => u !== url))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {wies && mediaUrls.length < 12 ? (
            <div className="mt-3">
              <WgrajObrazWiesKlient
                villageId={wies.id}
                etykieta="Dodaj zdjęcie"
                aktualnyUrl=""
                podkatalog="historia"
                onUrl={(url) => ustawMediaUrls((prev) => (prev.includes(url) ? prev : [...prev, url].slice(0, 12)))}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={czek}
            className="min-h-11 rounded-lg bg-green-800 px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {czek ? "Zapisuję…" : edytowanyId ? "Zapisz zmiany" : "Opublikuj wpis"}
          </button>
          {edytowanyId ? (
            <button type="button" onClick={wyczyscFormularz} className="min-h-11 rounded-lg border border-stone-300 px-4 text-sm">
              Anuluj edycję
            </button>
          ) : null}
        </div>
        {blad ? <p className="text-sm text-red-700">{blad}</p> : null}
        {komunikat ? <p className="text-sm text-green-800">{komunikat}</p> : null}
      </form>

      {wies ? (
        <section className="space-y-4">
          <QrKronikaHistoriiKlient nazwaWsi={wies.name} sciezkaProfilu={sciezka} />
          <p className="text-xs text-stone-600">
            Kanał RSS (dla portali i czytników):{" "}
            <a href={urlRssHistoriiWsi(wies.id)} className="font-medium text-green-800 underline break-all">
              {urlRssHistoriiWsi(wies.id)}
            </a>
          </p>
        </section>
      ) : null}

      {wies ? (
        <section className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
          <h2 className="text-sm font-semibold text-stone-800">Widget na stronie gminy (iframe)</h2>
          <p className="mt-1 text-xs text-stone-500">Osadź kronikę na BIP lub portalu — bez logowania.</p>
          <div className="mt-3">
            <KodyEmbedWsiKlient villageId={wies.id} />
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-semibold text-stone-900">Opublikowane wpisy ({opublikowane.length})</h2>
        {opublikowane.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Brak wpisów — dodaj pierwszy opis z miejscowości lub archiwum.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {opublikowane.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{w.title}</p>
                  {w.era_label ? <p className="text-xs text-amber-800">{w.era_label}</p> : null}
                  {w.short_description ? <p className="mt-1 text-sm text-stone-600">{w.short_description}</p> : null}
                  <p className="mt-1 text-xs text-stone-500">
                    {w.event_date ? new Date(w.event_date).toLocaleDateString("pl-PL") : "bez daty"}
                    {w.location_label ? ` · ${w.location_label}` : ""}
                    {w.media_urls.length > 0 ? ` · ${w.media_urls.length} zdj.` : ""}
                    {w.latitude != null ? " · pinezka" : ""}
                    {w.view_count > 0 ? ` · ${w.view_count} odsłon` : ""}
                    {w.candle_count > 0 ? ` · 🕯 ${w.candle_count}` : ""}
                    {w.is_featured ? " · wyróżniony" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`${sciezka}/historia/${w.id}`}
                    className="text-xs font-medium text-green-800 underline"
                  >
                    Podgląd
                  </Link>
                  <button
                    type="button"
                    disabled={czek}
                    className="text-xs font-medium text-amber-800 underline disabled:opacity-60"
                    onClick={() => {
                      if (!wies) return;
                      startT(async () => {
                        const wynik = await przelaczWyroznienieWpisuHistorii({ villageId: wies.id, id: w.id });
                        if ("blad" in wynik && wynik.blad) {
                          ustawBlad(wynik.blad);
                          return;
                        }
                        ustawKomunikat(w.is_featured ? "Usunięto wyróżnienie." : "Wpis wyróżniony na profilu.");
                        router.refresh();
                      });
                    }}
                  >
                    {w.is_featured ? "Odznacz wyróżnienie" : "Wyróżnij na profilu"}
                  </button>
                  <button type="button" onClick={() => rozpocznijEdycje(w)} className="text-xs font-medium text-stone-700 underline">
                    Edytuj
                  </button>
                  <button type="button" onClick={() => usun(w.id)} className="text-xs font-medium text-red-700 underline">
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
