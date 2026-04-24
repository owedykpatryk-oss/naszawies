"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { zlozRezerwacjeSwietlicy } from "../../akcje";

const typyWydarzen = ["urodziny", "wesele", "zebranie", "zajecia", "inne"] as const;

type Props = { hallId: string; maxGosci: number | null };

export function RezerwacjaSwietlicyFormularz({ hallId, maxGosci }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState("");
  const [oczekuje, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const startAt = String(fd.get("start_at") || "");
    const endAt = String(fd.get("end_at") || "");
    const eventType = String(fd.get("event_type") || "inne");
    const eventTitle = String(fd.get("event_title") || "").trim();
    const expectedGuests = Number(fd.get("expected_guests"));
    const hasAlcohol = fd.get("has_alcohol") === "on";
    const contactPhone = String(fd.get("contact_phone") || "").trim();
    const acceptRules = fd.get("accept_rules") === "on";

    ustawBlad("");
    ustawSukces("");

    if (!typyWydarzen.includes(eventType as (typeof typyWydarzen)[number])) {
      ustawBlad("Wybierz typ wydarzenia.");
      return;
    }
    if (!acceptRules) {
      ustawBlad("Musisz zaakceptować regulamin i zasady sali.");
      return;
    }
    if (Number.isNaN(expectedGuests) || expectedGuests < 1) {
      ustawBlad("Podaj planowaną liczbę osób.");
      return;
    }
    if (maxGosci != null && expectedGuests > maxGosci) {
      ustawBlad(`Sala pomieści maksymalnie ${maxGosci} osób.`);
      return;
    }

    const startIso = new Date(startAt).toISOString();
    const endIso = new Date(endAt).toISOString();

    startTransition(async () => {
      const wynik = await zlozRezerwacjeSwietlicy({
        hallId,
        startAt: startIso,
        endAt: endIso,
        eventType: eventType as (typeof typyWydarzen)[number],
        eventTitle: eventTitle.length ? eventTitle : null,
        expectedGuests,
        hasAlcohol,
        contactPhone: contactPhone.length ? contactPhone : null,
        acceptRules: true as const,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawSukces(wynik.komunikat ?? "Wysłano wniosek o rezerwację.");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form
      className="mt-4 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      {sukces ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {sukces}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rs-start" className="mb-1 block text-sm font-medium text-stone-700">
            Od (data i godzina)
          </label>
          <input
            id="rs-start"
            name="start_at"
            type="datetime-local"
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-green-800 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="rs-end" className="mb-1 block text-sm font-medium text-stone-700">
            Do (data i godzina)
          </label>
          <input
            id="rs-end"
            name="end_at"
            type="datetime-local"
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-green-800 focus:ring-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="rs-type" className="mb-1 block text-sm font-medium text-stone-700">
          Typ wydarzenia
        </label>
        <select
          id="rs-type"
          name="event_type"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-green-800 focus:ring-2"
          defaultValue="inne"
        >
          <option value="urodziny">Urodziny / impreza rodzinna</option>
          <option value="wesele">Wesele / przyjęcie</option>
          <option value="zebranie">Zebranie wiejskie</option>
          <option value="zajecia">Zajęcia / warsztaty</option>
          <option value="inne">Inne</option>
        </select>
      </div>

      <div>
        <label htmlFor="rs-title" className="mb-1 block text-sm font-medium text-stone-700">
          Tytuł / krótki opis (opcjonalnie)
        </label>
        <input
          id="rs-title"
          name="event_title"
          type="text"
          maxLength={200}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-green-800 focus:ring-2"
          placeholder="np. Zebranie KGW"
        />
      </div>

      <div>
        <label htmlFor="rs-guests" className="mb-1 block text-sm font-medium text-stone-700">
          Planowana liczba osób
        </label>
        <input
          id="rs-guests"
          name="expected_guests"
          type="number"
          min={1}
          max={maxGosci ?? 5000}
          required
          defaultValue={20}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
        {maxGosci != null ? (
          <p className="mt-1 text-xs text-stone-500">Limit sali: {maxGosci} osób.</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="rs-phone" className="mb-1 block text-sm font-medium text-stone-700">
          Telefon kontaktowy (opcjonalnie)
        </label>
        <input
          id="rs-phone"
          name="contact_phone"
          type="tel"
          maxLength={40}
          autoComplete="tel"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700">
        <input name="has_alcohol" type="checkbox" className="mt-1 accent-green-800" />
        <span>Planuję podawanie alkoholu (zgodnie z obowiązującymi przepisami i zasadami gminy).</span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700">
        <input name="accept_rules" type="checkbox" required className="mt-1 accent-green-800" />
        <span>
          Zapoznałem/am się z regulaminem korzystania z sali i zobowiązuję się do jego przestrzegania.
        </span>
      </label>

      <button
        type="submit"
        disabled={oczekuje}
        className="rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
      >
        {oczekuje ? "Wysyłanie…" : "Wyślij wniosek o rezerwację"}
      </button>
    </form>
  );
}
