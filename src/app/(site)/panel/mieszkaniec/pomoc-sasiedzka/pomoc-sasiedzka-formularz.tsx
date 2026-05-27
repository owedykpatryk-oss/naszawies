"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dodajOfertePomocySasiedzkiej } from "./akcje";

type WiesOpcja = { id: string; name: string };

export function PomocSasiedzkaFormularz({ wsie }: { wsie: WiesOpcja[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  if (wsie.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Potrzebujesz aktywnej roli we wsi.{" "}
        <a href="/panel/mieszkaniec" className="text-green-800 underline">
          Panel mieszkańca
        </a>
      </p>
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await dodajOfertePomocySasiedzkiej({
        villageId: String(fd.get("village_id")),
        kind: String(fd.get("kind")) as "szukam" | "oferuje",
        category: String(fd.get("category")) as "transport" | "zakupy" | "opieka" | "inne",
        title: String(fd.get("title")),
        body: String(fd.get("body")),
        contactHint: String(fd.get("contact_hint") || "") || null,
        dniWaznosci: Number(fd.get("dni_waznosci") || 14),
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm" htmlFor="ps-wies">
            Wieś
          </label>
          <select id="ps-wies" name="village_id" required defaultValue={wsie[0]?.id}>
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="ps-kind">
            Typ
          </label>
          <select id="ps-kind" name="kind" defaultValue="oferuje">
            <option value="oferuje">Oferuję pomoc</option>
            <option value="szukam">Szukam pomocy</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="ps-kat">
            Kategoria
          </label>
          <select id="ps-kat" name="category" defaultValue="inne">
            <option value="transport">Transport</option>
            <option value="zakupy">Zakupy</option>
            <option value="opieka">Opieka</option>
            <option value="inne">Inne</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="ps-dni">
            Ważne (dni)
          </label>
          <input id="ps-dni" name="dni_waznosci" type="number" min={1} max={60} defaultValue={14} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm" htmlFor="ps-tyt">
            Tytuł
          </label>
          <input id="ps-tyt" name="title" required minLength={3} maxLength={120} placeholder="np. Odbiór z paczkomatu" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm" htmlFor="ps-opis">
            Opis
          </label>
          <textarea id="ps-opis" name="body" required minLength={10} rows={4} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm" htmlFor="ps-kontakt">
            Kontakt (opcjonalnie, widoczny po zatwierdzeniu)
          </label>
          <input id="ps-kontakt" name="contact_hint" maxLength={200} placeholder="np. tel. w godz. 17–20" />
        </div>
      </div>
      <p className="text-xs text-stone-500">Sołtys zatwierdza ogłoszenie przed publikacją na profilu wsi.</p>
      <button
        type="submit"
        disabled={czek}
        className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
      >
        {czek ? "Wysyłanie…" : "Wyślij do moderacji"}
      </button>
    </form>
  );
}
