"use client";

import { FormEvent, useState, useTransition } from "react";
import { aktualizujProfilBudynkuSwietlicy } from "@/app/(site)/panel/soltys/akcje";

type Props = {
  hallId: string;
  poczatek: {
    address: string | null;
    area_m2: number | null;
    max_capacity: number | null;
    parking_spaces: number | null;
    description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    contact_duty_hours: string | null;
    caretaker_name: string | null;
  };
};

export function ProfilBudynkuSwietlicyKlient({ hallId, poczatek }: Props) {
  const [otwarty, ustawOtwarty] = useState(false);
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [oczekuje, startTransition] = useTransition();

  function onZapisz(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parseNum = (k: string) => {
      const raw = String(fd.get(k) ?? "").trim();
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    };

    ustawKomunikat(null);
    startTransition(async () => {
      const wynik = await aktualizujProfilBudynkuSwietlicy({
        hallId,
        address: String(fd.get("address") ?? "").trim() || null,
        description: String(fd.get("description") ?? "").trim() || null,
        max_capacity: parseNum("max_capacity"),
        area_m2: parseNum("area_m2"),
        parking_spaces: parseNum("parking_spaces"),
        caretaker_name: String(fd.get("caretaker_name") ?? "").trim() || null,
        contact_phone: String(fd.get("contact_phone") ?? "").trim() || null,
        contact_email: String(fd.get("contact_email") ?? "").trim() || null,
        contact_duty_hours: String(fd.get("contact_duty_hours") ?? "").trim() || null,
      });
      if ("blad" in wynik) {
        ustawKomunikat(wynik.blad);
        return;
      }
      ustawKomunikat("Zapisano profil budynku.");
      ustawOtwarty(false);
    });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => ustawOtwarty((v) => !v)}
        className="rounded-lg border border-emerald-700/40 bg-white px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
      >
        {otwarty ? "Zwiń edycję budynku" : "Edytuj adres, parking i dane budynku"}
      </button>

      {komunikat ? <p className="mt-2 text-sm text-green-800">{komunikat}</p> : null}

      {otwarty ? (
        <form
          onSubmit={onZapisz}
          className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-address">
              Adres budynku
            </label>
            <input
              id="pb-address"
              name="address"
              maxLength={300}
              defaultValue={poczatek.address ?? ""}
              placeholder="np. ul. Leśna 17, 89-100 Nazwa miejscowości"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-cap">
              Pojemność (max osób)
            </label>
            <input
              id="pb-cap"
              name="max_capacity"
              type="number"
              min={1}
              max={9999}
              defaultValue={poczatek.max_capacity ?? ""}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-area">
              Powierzchnia użytkowa (m²)
            </label>
            <input
              id="pb-area"
              name="area_m2"
              type="number"
              min={1}
              step="0.1"
              max={99999}
              defaultValue={poczatek.area_m2 ?? ""}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-park">
              Miejsca parkingowe
            </label>
            <input
              id="pb-park"
              name="parking_spaces"
              type="number"
              min={0}
              max={999}
              defaultValue={poczatek.parking_spaces ?? ""}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-caretaker">
              Opiekun / opiekunka
            </label>
            <input
              id="pb-caretaker"
              name="caretaker_name"
              maxLength={120}
              defaultValue={poczatek.caretaker_name ?? ""}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-phone">
              Telefon kontaktowy
            </label>
            <input
              id="pb-phone"
              name="contact_phone"
              maxLength={40}
              defaultValue={poczatek.contact_phone ?? ""}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-email">
              E-mail kontaktowy
            </label>
            <input
              id="pb-email"
              name="contact_email"
              type="email"
              maxLength={120}
              defaultValue={poczatek.contact_email ?? ""}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-duty">
              Godziny dyżurów opiekuna
            </label>
            <input
              id="pb-duty"
              name="contact_duty_hours"
              maxLength={500}
              defaultValue={poczatek.contact_duty_hours ?? ""}
              placeholder="np. pon.–pt. 16:00–18:00, sob. przed wydarzeniami"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-stone-500">
              Te dane trafią na profil publiczny wsi i do dokumentu wynajmu. Kontakty urzędowe (sołtys, rada) edytujesz w{" "}
              <a href="/panel/soltys/spolecznosc" className="text-emerald-800 underline">
                Społeczność → Kontakty
              </a>
              .
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor="pb-desc">
              Opis budynku (dla mieszkańców)
            </label>
            <textarea
              id="pb-desc"
              name="description"
              rows={3}
              maxLength={4000}
              defaultValue={poczatek.description ?? ""}
              placeholder="np. Nowa świetlica z wiatrołapem, kuchnią i salą w kształcie L…"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={oczekuje}
              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
            >
              {oczekuje ? "Zapisuję…" : "Zapisz profil budynku"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
