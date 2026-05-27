"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ETYKIETY_KATEGORII_LINKOW,
  KATEGORIE_LINKOW_PRZYDATNYCH,
  PAKIETY_LINKOW_PRZYDATNYCH,
  type KategoriaLinkuPrzydatnego,
} from "@/lib/wies/linki-przydatne";
import { dodajPakietLinkowPrzydatnych, usunLinkPrzydatnyWsi, zapiszLinkPrzydatnyWsi } from "../akcje";

export type WiesDoInformacji = { id: string; name: string; commune: string };

export type LinkDoEdycji = {
  id: string;
  village_id: string;
  category: KategoriaLinkuPrzydatnego;
  title: string;
  url: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  display_order: number;
  is_active: boolean;
};

export function InformacjeLokalneKlient({ wsie, linki }: { wsie: WiesDoInformacji[]; linki: LinkDoEdycji[] }) {
  const router = useRouter();
  const [villageId, setVillageId] = useState(wsie[0]?.id ?? "");
  const [edytowanyId, setEdytowanyId] = useState<string | null>(null);
  const [czek, startT] = useTransition();
  const [komunikat, setKomunikat] = useState("");
  const [blad, setBlad] = useState("");

  const linkiWsi = useMemo(() => linki.filter((l) => l.village_id === villageId), [linki, villageId]);
  const edytowany = linkiWsi.find((l) => l.id === edytowanyId) ?? null;
  const nazwaWsi = wsie.find((w) => w.id === villageId)?.name ?? "";
  const gmina = wsie.find((w) => w.id === villageId)?.commune ?? "";

  function onZapiszLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const wynik = await zapiszLinkPrzydatnyWsi({
        villageId,
        id: edytowanyId ?? undefined,
        category: String(fd.get("category")) as KategoriaLinkuPrzydatnego,
        title: String(fd.get("title") ?? ""),
        url: String(fd.get("url") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        email: String(fd.get("email") ?? ""),
        note: String(fd.get("note") ?? ""),
        display_order: Number(fd.get("display_order") ?? 0),
        is_active: fd.get("is_active") === "on",
      });
      if ("blad" in wynik && wynik.blad) {
        setBlad(wynik.blad);
        return;
      }
      setKomunikat(edytowanyId ? "Zaktualizowano link." : "Dodano link.");
      setEdytowanyId(null);
      router.refresh();
    });
  }

  function onUsun(id: string) {
    if (!confirm("Usunąć ten wpis?")) return;
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const wynik = await usunLinkPrzydatnyWsi(id, villageId);
      if ("blad" in wynik && wynik.blad) {
        setBlad(wynik.blad);
        return;
      }
      setKomunikat("Usunięto.");
      if (edytowanyId === id) setEdytowanyId(null);
      router.refresh();
    });
  }

  function onPakiet(pakietId: string) {
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const wynik = await dodajPakietLinkowPrzydatnych(villageId, pakietId);
      if ("blad" in wynik && wynik.blad) {
        setBlad(wynik.blad);
        return;
      }
      setKomunikat(
        wynik.dodano === 0
          ? "Wszystkie pozycje z pakietu już istnieją — nic nie dodano."
          : `Dodano ${wynik.dodano} pozycji z pakietu — uzupełnij linki i telefony.`,
      );
      router.refresh();
    });
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-stone-800" htmlFor="wies-info">
          Wieś
        </label>
        <select
          id="wies-info"
          className="mt-2 w-full max-w-sm rounded border border-stone-300 px-3 py-2 text-sm"
          value={villageId}
          onChange={(e) => {
            setVillageId(e.target.value);
            setEdytowanyId(null);
          }}
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-stone-500">
          Linki dla: <strong>{nazwaWsi}</strong> (gmina {gmina}).
        </p>
        {komunikat ? (
          <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{komunikat}</p>
        ) : null}
        {blad ? <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{blad}</p> : null}
      </div>

      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
        <h2 className="text-sm font-semibold text-emerald-950">Szybkie szablony</h2>
        <p className="mt-1 text-xs text-stone-600">
          Dodają gotowe tytuły i kategorie — potem uzupełnij adresy URL i numery telefonów.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PAKIETY_LINKOW_PRZYDATNYCH.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={czek}
              onClick={() => onPakiet(p.id)}
              className="rounded-full border border-emerald-700/30 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
              title={p.opis}
            >
              + {p.etykieta}
            </button>
          ))}
        </div>
      </div>

      <form
        key={edytowanyId ?? "nowy"}
        onSubmit={onZapiszLink}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-stone-900">{edytowany ? "Edycja wpisu" : "Nowy link lub numer"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-stone-800">
            Kategoria
            <select
              name="category"
              defaultValue={edytowany?.category ?? "bip_gmina"}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
            >
              {KATEGORIE_LINKOW_PRZYDATNYCH.map((k) => (
                <option key={k} value={k}>
                  {ETYKIETY_KATEGORII_LINKOW[k].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-stone-800">
            Kolejność (mniejsza = wyżej)
            <input
              name="display_order"
              type="number"
              defaultValue={edytowany?.display_order ?? 0}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-stone-800">
          Tytuł *
          <input
            name="title"
            required
            maxLength={200}
            defaultValue={edytowany?.title ?? ""}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
            placeholder="np. BIP gminy — strona główna"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Adres strony (URL)
          <input
            name="url"
            type="url"
            defaultValue={edytowany?.url ?? ""}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-stone-800">
            Telefon
            <input
              name="phone"
              defaultValue={edytowany?.phone ?? ""}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-stone-800">
            E-mail
            <input
              name="email"
              type="email"
              defaultValue={edytowany?.email ?? ""}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-stone-800">
          Notatka (np. godziny urzędu)
          <textarea
            name="note"
            rows={2}
            defaultValue={edytowany?.note ?? ""}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input name="is_active" type="checkbox" defaultChecked={edytowany?.is_active ?? true} />
          Widoczny na profilu wsi
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={czek}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
          >
            {czek ? "Zapisuję…" : edytowany ? "Zapisz zmiany" : "Dodaj"}
          </button>
          {edytowany ? (
            <button
              type="button"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm"
              onClick={() => setEdytowanyId(null)}
            >
              Anuluj edycję
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
        <h2 className="text-sm font-semibold text-stone-900">Lista ({linkiWsi.length})</h2>
        {linkiWsi.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Brak wpisów — użyj szablonu lub formularza powyżej.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {linkiWsi.map((l) => (
              <li
                key={l.id}
                className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                  l.is_active ? "border-stone-200 bg-white" : "border-stone-100 bg-stone-100 opacity-70"
                }`}
              >
                <div>
                  <p className="font-medium text-stone-900">{l.title}</p>
                  <p className="text-xs text-stone-500">
                    {ETYKIETY_KATEGORII_LINKOW[l.category].label}
                    {l.url ? ` · ${l.url}` : ""}
                    {l.phone ? ` · tel. ${l.phone}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-green-800 underline"
                    onClick={() => setEdytowanyId(l.id)}
                  >
                    Edytuj
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-800 underline"
                    disabled={czek}
                    onClick={() => onUsun(l.id)}
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
