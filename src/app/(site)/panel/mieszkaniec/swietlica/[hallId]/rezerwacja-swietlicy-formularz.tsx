"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { zlozRezerwacjeSwietlicy } from "../../akcje";

const typyWydarzen = ["urodziny", "wesele", "zebranie", "zajecia", "inne"] as const;
const typyUstawienia = ["auto_bankiet", "teatralny", "warsztatowy", "u_ksztalt", "wlasny"] as const;

type Props = {
  hallId: string;
  maxGosci: number | null;
  inventory: { id: string; name: string; quantity_available: number | null; quantity: number }[];
};

export function RezerwacjaSwietlicyFormularz({ hallId, maxGosci, inventory }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState("");
  const [oczekuje, startTransition] = useTransition();
  const [requested, setRequested] = useState<Record<string, number>>({});
  const [expectedGuestsInput, setExpectedGuestsInput] = useState<number>(20);
  const [seatingPresetInput, setSeatingPresetInput] =
    useState<(typeof typyUstawienia)[number]>("auto_bankiet");

  const sortedInventory = useMemo(
    () => [...inventory].sort((a, b) => a.name.localeCompare(b.name, "pl-PL")),
    [inventory]
  );
  const chairsAvailable = useMemo(
    () =>
      sortedInventory
        .filter((i) => i.name.toLowerCase().includes("krzes"))
        .reduce((sum, i) => sum + dostepne(i), 0),
    [sortedInventory]
  );
  const estimatedTables = useMemo(() => Math.max(1, Math.ceil(expectedGuestsInput / 8)), [expectedGuestsInput]);
  const maxRequestedGap = useMemo(() => {
    let gap = 0;
    for (const it of sortedInventory) {
      const req = requested[it.id] ?? 0;
      const available = dostepne(it);
      if (req > available) gap += req - available;
    }
    return gap;
  }, [requested, sortedInventory]);

  function dostepne(i: { quantity_available: number | null; quantity: number }) {
    return i.quantity_available ?? i.quantity;
  }

  function ustawPakiet(pakiet: "zebranie" | "warsztaty" | "impreza") {
    const nowy: Record<string, number> = {};
    for (const it of sortedInventory) {
      const n = it.name.toLowerCase();
      if (pakiet === "zebranie" && (n.includes("krzes") || n.includes("stol") || n.includes("mikrofon"))) {
        nowy[it.id] = Math.min(10, Math.max(1, Math.floor(dostepne(it) * 0.5)));
      }
      if (pakiet === "warsztaty" && (n.includes("stol") || n.includes("przedluz") || n.includes("krzes"))) {
        nowy[it.id] = Math.min(8, Math.max(1, Math.floor(dostepne(it) * 0.4)));
      }
      if (pakiet === "impreza" && (n.includes("krzes") || n.includes("nacz") || n.includes("stol"))) {
        nowy[it.id] = Math.min(20, Math.max(1, Math.floor(dostepne(it) * 0.6)));
      }
    }
    setRequested(nowy);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const startAt = String(fd.get("start_at") || "");
    const endAt = String(fd.get("end_at") || "");
    const eventType = String(fd.get("event_type") || "inne");
    const seatingPreset = String(fd.get("seating_preset") || "wlasny");
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
    if (!typyUstawienia.includes(seatingPreset as (typeof typyUstawienia)[number])) {
      ustawBlad("Wybierz sposób ustawienia sali.");
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

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      ustawBlad("Podaj poprawny termin rozpoczęcia i zakończenia.");
      return;
    }
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();
    const requestedInventory = Object.entries(requested)
      .filter(([, q]) => Number.isFinite(q) && q > 0)
      .map(([inventoryId, quantity]) => ({ inventoryId, quantity: Math.trunc(quantity) }));

    startTransition(async () => {
      const wynik = await zlozRezerwacjeSwietlicy({
        hallId,
        startAt: startIso,
        endAt: endIso,
        eventType: eventType as (typeof typyWydarzen)[number],
        eventTitle: eventTitle.length ? eventTitle : null,
        seatingPreset: seatingPreset as (typeof typyUstawienia)[number],
        requestedInventory,
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
      setRequested({});
      router.refresh();
    });
  }

  return (
    <form
      className="forms-premium mt-4 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
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
      <div className="rounded-lg border border-sky-200/80 bg-sky-50/50 p-3 text-xs text-stone-700">
        <p className="font-semibold text-sky-900">Wniosek bez poprawek — checklista</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>Podaj realną liczbę gości (ułatwia dobór stołów i krzeseł).</li>
          <li>Wybierz ustawienie sali zgodne z charakterem wydarzenia.</li>
          <li>Zaznacz tylko faktycznie potrzebny asortyment.</li>
        </ul>
      </div>

      <nav className="sekcja-form-nav flex items-center gap-2" aria-label="Skróty sekcji rezerwacji">
        <a href="#rs-sekcja-termin" className="sekcja-form-nav-link">
          Termin
        </a>
        <a href="#rs-sekcja-ustawienia" className="sekcja-form-nav-link">
          Ustawienia
        </a>
        <a href="#rs-sekcja-asortyment" className="sekcja-form-nav-link">
          Asortyment
        </a>
        <a href="#rs-sekcja-zgody" className="sekcja-form-nav-link">
          Zgody
        </a>
      </nav>

      <div id="rs-sekcja-termin" className="scroll-mt-[10.5rem] grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rs-start" className="mb-1 block">
            Od (data i godzina)
          </label>
          <input id="rs-start" name="start_at" type="datetime-local" required />
        </div>
        <div>
          <label htmlFor="rs-end" className="mb-1 block">
            Do (data i godzina)
          </label>
          <input id="rs-end" name="end_at" type="datetime-local" required />
        </div>
      </div>

      <div id="rs-sekcja-ustawienia" className="scroll-mt-[10.5rem]">
        <label htmlFor="rs-type" className="mb-1 block">
          Typ wydarzenia
        </label>
        <select id="rs-type" name="event_type" defaultValue="inne">
          <option value="urodziny">Urodziny / impreza rodzinna</option>
          <option value="wesele">Wesele / przyjęcie</option>
          <option value="zebranie">Zebranie wiejskie</option>
          <option value="zajecia">Zajęcia / warsztaty</option>
          <option value="inne">Inne</option>
        </select>
      </div>

      <div>
        <label htmlFor="rs-seating" className="mb-1 block">
          Preferowane ustawienie sali
        </label>
        <select
          id="rs-seating"
          name="seating_preset"
          onChange={(e) => setSeatingPresetInput(e.target.value as (typeof typyUstawienia)[number])}
          defaultValue="auto_bankiet"
        >
          <option value="auto_bankiet">Auto bankiet (na liczbę gości)</option>
          <option value="teatralny">Teatralny (rzędy)</option>
          <option value="warsztatowy">Warsztatowy (wyspy)</option>
          <option value="u_ksztalt">U-kształt</option>
          <option value="wlasny">Własny / bez zmian</option>
        </select>
      </div>

      <div>
        <label htmlFor="rs-title" className="mb-1 block">
          Tytuł / krótki opis (opcjonalnie)
        </label>
        <input id="rs-title" name="event_title" type="text" maxLength={200} placeholder="np. Zebranie KGW" />
      </div>

      <div>
        <label htmlFor="rs-guests" className="mb-1 block">
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
          onChange={(e) => setExpectedGuestsInput(Math.max(1, Number(e.target.value) || 1))}
        />
        {maxGosci != null ? (
          <p className="mt-1 text-xs text-stone-500">Limit sali: {maxGosci} osób.</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm">
        <p className="font-medium text-stone-800">Podsumowanie przygotowania (na żywo)</p>
        <ul className="mt-2 space-y-1 text-xs text-stone-700">
          <li>
            Układ: <strong>{seatingPresetInput}</strong>
          </li>
          <li>
            Szacowana liczba stołów (przy 8 os./stół): <strong>{estimatedTables}</strong>
          </li>
          <li>
            Dostępne krzesła w katalogu: <strong>{chairsAvailable}</strong>
          </li>
          {chairsAvailable > 0 && expectedGuestsInput > chairsAvailable ? (
            <li className="text-amber-800">
              Uwaga: goście ({expectedGuestsInput}) przekraczają dostępną liczbę krzeseł ({chairsAvailable}).
            </li>
          ) : null}
          {maxRequestedGap > 0 ? (
            <li className="text-red-700">
              Uwaga: w zamówionym asortymencie brakuje łącznie <strong>{maxRequestedGap}</strong> szt.
            </li>
          ) : null}
        </ul>
      </div>

      <div>
        <label htmlFor="rs-phone" className="mb-1 block">
          Telefon kontaktowy (opcjonalnie)
        </label>
        <input id="rs-phone" name="contact_phone" type="tel" maxLength={40} autoComplete="tel" />
      </div>

      {sortedInventory.length > 0 ? (
        <div id="rs-sekcja-asortyment" className="scroll-mt-[10.5rem] rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-sm font-medium text-stone-800">Asortyment do rezerwacji (opcjonalnie)</p>
          <p className="mt-1 text-xs text-stone-600">
            Możesz od razu zaznaczyć, czego potrzebujesz. Sołtys zobaczy listę przy wniosku.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => ustawPakiet("zebranie")}
              className="min-h-[40px] rounded border border-stone-300 bg-white px-2 py-1 text-xs"
            >
              Pakiet: zebranie
            </button>
            <button
              type="button"
              onClick={() => ustawPakiet("warsztaty")}
              className="min-h-[40px] rounded border border-stone-300 bg-white px-2 py-1 text-xs"
            >
              Pakiet: warsztaty
            </button>
            <button
              type="button"
              onClick={() => ustawPakiet("impreza")}
              className="min-h-[40px] rounded border border-stone-300 bg-white px-2 py-1 text-xs"
            >
              Pakiet: impreza
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {sortedInventory.slice(0, 16).map((it) => {
              const max = dostepne(it);
              return (
                <li key={it.id} className="grid grid-cols-[1fr,90px] items-center gap-2">
                  <label className="text-xs text-stone-700">
                    {it.name} <span className="text-stone-500">(dostępne: {max})</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={requested[it.id] ?? 0}
                    onChange={(e) =>
                      setRequested((prev) => ({
                        ...prev,
                        [it.id]: Math.max(0, Math.min(max, Number(e.target.value) || 0)),
                      }))
                    }
                    className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <label id="rs-sekcja-zgody" className="scroll-mt-[10.5rem] flex cursor-pointer items-start gap-2 text-sm text-stone-700">
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
