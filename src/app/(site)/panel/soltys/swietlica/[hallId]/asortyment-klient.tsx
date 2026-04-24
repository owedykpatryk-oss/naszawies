"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { ZdjecieAsortymentu } from "@/components/swietlica/zdjecie-asortymentu";
import {
  aktualizujWyposazenieSwietlicy,
  dodajWyposazenieSwietlicy,
  usunWyposazenieSwietlicy,
} from "../../akcje";

export type PozycjaWyposazenia = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  quantity: number;
  quantity_available: number | null;
  condition: string | null;
  image_url: string | null;
};

type Props = {
  hallId: string;
  nazwaSali: string;
  pozycje: PozycjaWyposazenia[];
};

function liczbaDostepna(p: PozycjaWyposazenia) {
  return p.quantity_available ?? p.quantity;
}

export function AsortymentSwietlicyKlient({ hallId, nazwaSali, pozycje }: Props) {
  const router = useRouter();
  const [edycjaId, ustawEdycjaId] = useState<string | null>(null);
  const [komunikat, ustawKomunikat] = useState<{ typ: "ok" | "blad"; tresc: string } | null>(null);
  const [oczekuje, startTransition] = useTransition();

  function odswiezListe() {
    router.refresh();
    ustawEdycjaId(null);
  }

  async function onDodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const category = String(fd.get("category") || "").trim();
    const name = String(fd.get("name") || "").trim();
    const descriptionRaw = String(fd.get("description") || "").trim();
    const quantity = Number(fd.get("quantity"));
    const qaRaw = String(fd.get("quantity_available") || "").trim();
    const quantity_available = qaRaw === "" ? null : Number(qaRaw);
    if (Number.isNaN(quantity) || quantity < 1) {
      ustawKomunikat({ typ: "blad", tresc: "Podaj poprawną liczbę sztuk." });
      return;
    }
    if (qaRaw !== "" && (Number.isNaN(quantity_available as number) || (quantity_available as number) < 0)) {
      ustawKomunikat({ typ: "blad", tresc: "„Dostępne” musi być liczbą ≥ 0 lub puste." });
      return;
    }

    ustawKomunikat(null);
    startTransition(async () => {
      const wynik = await dodajWyposazenieSwietlicy({
        hallId,
        category,
        name,
        description: descriptionRaw.length ? descriptionRaw : null,
        quantity,
        quantity_available,
        condition: String(fd.get("condition") || "good").trim() || "good",
      });
      if ("blad" in wynik) {
        ustawKomunikat({ typ: "blad", tresc: wynik.blad });
        return;
      }
      (e.target as HTMLFormElement).reset();
      ustawKomunikat({ typ: "ok", tresc: "Dodano pozycję." });
      odswiezListe();
    });
  }

  async function onUsun(pozycjaId: string) {
    if (!window.confirm("Usunąć tę pozycję z listy?")) return;
    ustawKomunikat(null);
    startTransition(async () => {
      const wynik = await usunWyposazenieSwietlicy(hallId, pozycjaId);
      if ("blad" in wynik) {
        ustawKomunikat({ typ: "blad", tresc: wynik.blad });
        return;
      }
      ustawKomunikat({ typ: "ok", tresc: "Usunięto." });
      odswiezListe();
    });
  }

  async function onZapiszEdycje(e: FormEvent<HTMLFormElement>, pozycjaId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const category = String(fd.get("category") || "").trim();
    const name = String(fd.get("name") || "").trim();
    const descriptionRaw = String(fd.get("description") || "").trim();
    const quantity = Number(fd.get("quantity"));
    const qaRaw = String(fd.get("quantity_available") || "").trim();
    const quantity_available = qaRaw === "" ? null : Number(qaRaw);
    if (Number.isNaN(quantity) || quantity < 1) {
      ustawKomunikat({ typ: "blad", tresc: "Podaj poprawną liczbę sztuk." });
      return;
    }
    if (qaRaw !== "" && (Number.isNaN(quantity_available as number) || (quantity_available as number) < 0)) {
      ustawKomunikat({ typ: "blad", tresc: "„Dostępne” musi być liczbą ≥ 0 lub puste." });
      return;
    }

    ustawKomunikat(null);
    startTransition(async () => {
      const wynik = await aktualizujWyposazenieSwietlicy({
        hallId,
        pozycjaId,
        category,
        name,
        description: descriptionRaw.length ? descriptionRaw : null,
        quantity,
        quantity_available,
        condition: String(fd.get("condition") || "good").trim() || "good",
      });
      if ("blad" in wynik) {
        ustawKomunikat({ typ: "blad", tresc: wynik.blad });
        return;
      }
      ustawEdycjaId(null);
      ustawKomunikat({ typ: "ok", tresc: "Zapisano zmiany." });
      odswiezListe();
    });
  }

  return (
    <div className="mt-8 space-y-8">
      <p className="text-sm text-stone-600">
        Sala: <strong className="text-stone-900">{nazwaSali}</strong>
      </p>

      {komunikat ? (
        <p
          role="status"
          className={
            komunikat.typ === "ok"
              ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900"
              : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
          }
        >
          {komunikat.tresc}
        </p>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Dodaj pozycję</h2>
        <p className="mt-1 text-xs text-stone-500">
          Kategoria: np. „piwnica”, „magazyn”, „meble”, „sprzęt AGD”.
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onDodaj}>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-name">
              Nazwa
            </label>
            <input
              id="add-name"
              name="name"
              required
              maxLength={200}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
              placeholder="np. Krzesła składane"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-cat">
              Kategoria / miejsce
            </label>
            <input
              id="add-cat"
              name="category"
              required
              maxLength={100}
              defaultValue="Magazyn / piwnica"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-cond">
              Stan
            </label>
            <select
              id="add-cond"
              name="condition"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
              defaultValue="good"
            >
              <option value="good">Dobry</option>
              <option value="fair">Do użytku z uwagami</option>
              <option value="damaged">Uszkodzony / do naprawy</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-qty">
              Liczba sztuk (łącznie)
            </label>
            <input
              id="add-qty"
              name="quantity"
              type="number"
              min={1}
              required
              defaultValue={1}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-qa">
              Dostępne teraz (puste = jak łącznie)
            </label>
            <input
              id="add-qa"
              name="quantity_available"
              type="number"
              min={0}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-desc">
              Opis (opcjonalnie)
            </label>
            <textarea
              id="add-desc"
              name="description"
              rows={2}
              maxLength={2000}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={oczekuje}
              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
            >
              {oczekuje ? "Zapisywanie…" : "Dodaj do listy"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-serif text-xl text-green-950">Lista wyposażenia</h2>
        {pozycje.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Brak pozycji — dodaj pierwszą powyżej.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {pozycje.map((p) => (
              <li key={p.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                {edycjaId === p.id ? (
                  <>
                    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => onZapiszEdycje(e, p.id)}>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-stone-600">Nazwa</label>
                        <input
                          name="name"
                          required
                          maxLength={200}
                          defaultValue={p.name}
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-stone-600">Kategoria</label>
                        <input
                          name="category"
                          required
                          maxLength={100}
                          defaultValue={p.category}
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-stone-600">Stan</label>
                        <select
                          name="condition"
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                          defaultValue={p.condition ?? "good"}
                        >
                          <option value="good">Dobry</option>
                          <option value="fair">Do użytku z uwagami</option>
                          <option value="damaged">Uszkodzony / do naprawy</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-stone-600">Łącznie sztuk</label>
                        <input
                          name="quantity"
                          type="number"
                          min={1}
                          required
                          defaultValue={p.quantity}
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-stone-600">Dostępne</label>
                        <input
                          name="quantity_available"
                          type="number"
                          min={0}
                          defaultValue={liczbaDostepna(p)}
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-stone-600">Opis</label>
                        <textarea
                          name="description"
                          rows={2}
                          maxLength={2000}
                          defaultValue={p.description ?? ""}
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <button
                          type="submit"
                          disabled={oczekuje}
                          className="rounded-lg bg-green-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
                        >
                          Zapisz
                        </button>
                        <button
                          type="button"
                          onClick={() => ustawEdycjaId(null)}
                          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
                        >
                          Anuluj
                        </button>
                      </div>
                    </form>
                    <ZdjecieAsortymentu hallId={hallId} pozycjaId={p.id} imageUrl={p.image_url} />
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 gap-3">
                        {p.image_url ? (
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900">{p.name}</p>
                          <p className="text-xs text-stone-500">
                            {p.category} · stan: {p.condition ?? "—"} · szt.: {p.quantity}, dostępne:{" "}
                            {liczbaDostepna(p)}
                          </p>
                          {p.description ? (
                            <p className="mt-2 text-sm text-stone-600">{p.description}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => ustawEdycjaId(p.id)}
                          className="rounded-lg border border-stone-300 px-2 py-1 text-xs font-medium hover:bg-stone-50"
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          onClick={() => onUsun(p.id)}
                          disabled={oczekuje}
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                    <ZdjecieAsortymentu hallId={hallId} pozycjaId={p.id} imageUrl={p.image_url} />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
