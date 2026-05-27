"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { ZdjecieAsortymentu } from "@/components/swietlica/zdjecie-asortymentu";
import {
  AKCJE_INWENTARZA,
  ETYKIETY_AKCJI_INWENTARZA,
  normalizujAkcjeInwentarza,
  type AkcjaInwentarza,
} from "@/lib/swietlica/inwentarz-status";
import {
  aktualizujWyposazenieSwietlicy,
  dodajPakietWowWyposazeniaSwietlicy,
  dodajPakietWyposazeniaSwietlicy,
  dodajWyposazenieSwietlicy,
  usunWyposazenieSwietlicy,
} from "@/app/(site)/panel/soltys/akcje";
import { EksportPlanWowSwietlicy } from "@/components/swietlica/eksport-plan-wow-swietlicy";

export type PozycjaWyposazenia = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  quantity: number;
  quantity_available: number | null;
  condition: string | null;
  image_url: string | null;
  inventory_action?: string | null;
  width_cm?: number | null;
  length_cm?: number | null;
  height_cm?: number | null;
  notes?: string | null;
};

type Props = {
  hallId: string;
  nazwaSali: string;
  nazwaWsi?: string;
  pozycje: PozycjaWyposazenia[];
};

type Filtr = "wszystko" | AkcjaInwentarza;

function liczbaDostepna(p: PozycjaWyposazenia) {
  return p.quantity_available ?? p.quantity;
}

function wymiaryTekst(p: PozycjaWyposazenia): string | null {
  const w = p.width_cm;
  const l = p.length_cm;
  const h = p.height_cm;
  if (!w && !l && !h) return null;
  const czesci = [w ? `${w} cm szer.` : null, l ? `${l} cm gł.` : null, h ? `${h} cm wys.` : null].filter(Boolean);
  return czesci.join(" · ");
}

export function AsortymentSwietlicyKlient({ hallId, nazwaSali, nazwaWsi, pozycje }: Props) {
  const router = useRouter();
  const [edycjaId, ustawEdycjaId] = useState<string | null>(null);
  const [filtr, ustawFiltr] = useState<Filtr>("wszystko");
  const [komunikat, ustawKomunikat] = useState<{ typ: "ok" | "blad"; tresc: string } | null>(null);
  const [oczekuje, startTransition] = useTransition();

  const statystyki = useMemo(() => {
    const lacznie = pozycje.reduce((s, p) => s + p.quantity, 0);
    const dostepne = pozycje.reduce((s, p) => s + liczbaDostepna(p), 0);
    const poAkcji = AKCJE_INWENTARZA.reduce(
      (acc, a) => {
        acc[a] = pozycje.filter((p) => normalizujAkcjeInwentarza(p.inventory_action) === a).length;
        return acc;
      },
      {} as Record<AkcjaInwentarza, number>,
    );
    return { lacznie, dostepne, poAkcji };
  }, [pozycje]);

  const widoczne = useMemo(() => {
    if (filtr === "wszystko") return pozycje;
    return pozycje.filter((p) => normalizujAkcjeInwentarza(p.inventory_action) === filtr);
  }, [pozycje, filtr]);

  function odswiezListe() {
    router.refresh();
    ustawEdycjaId(null);
  }

  function parseNum(raw: string): number | null {
    const t = raw.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  async function onDodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const quantity = Number(fd.get("quantity"));
    const qaRaw = String(fd.get("quantity_available") || "").trim();
    const quantity_available = qaRaw === "" ? null : Number(qaRaw);
    if (Number.isNaN(quantity) || quantity < 1) {
      ustawKomunikat({ typ: "blad", tresc: "Podaj poprawną liczbę sztuk." });
      return;
    }

    ustawKomunikat(null);
    startTransition(async () => {
      const wynik = await dodajWyposazenieSwietlicy({
        hallId,
        category: String(fd.get("category") || "").trim(),
        name: String(fd.get("name") || "").trim(),
        description: String(fd.get("description") || "").trim() || null,
        quantity,
        quantity_available,
        condition: String(fd.get("condition") || "good").trim() || "good",
        inventory_action: normalizujAkcjeInwentarza(String(fd.get("inventory_action") || "in_use")),
        width_cm: parseNum(String(fd.get("width_cm") || "")),
        length_cm: parseNum(String(fd.get("length_cm") || "")),
        height_cm: parseNum(String(fd.get("height_cm") || "")),
        notes: String(fd.get("notes") || "").trim() || null,
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

  async function onZapiszEdycje(e: FormEvent<HTMLFormElement>, p: PozycjaWyposazenia) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const quantity = Number(fd.get("quantity"));
    const qaRaw = String(fd.get("quantity_available") || "").trim();
    const quantity_available = qaRaw === "" ? null : Number(qaRaw);

    startTransition(async () => {
      const wynik = await aktualizujWyposazenieSwietlicy({
        hallId,
        pozycjaId: p.id,
        category: String(fd.get("category") || "").trim(),
        name: String(fd.get("name") || "").trim(),
        description: String(fd.get("description") || "").trim() || null,
        quantity,
        quantity_available,
        condition: String(fd.get("condition") || "good").trim() || "good",
        inventory_action: normalizujAkcjeInwentarza(String(fd.get("inventory_action") || "in_use")),
        width_cm: parseNum(String(fd.get("width_cm") || "")),
        length_cm: parseNum(String(fd.get("length_cm") || "")),
        height_cm: parseNum(String(fd.get("height_cm") || "")),
        notes: String(fd.get("notes") || "").trim() || null,
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

  function szybkaAkcja(p: PozycjaWyposazenia, akcja: AkcjaInwentarza) {
    startTransition(async () => {
      const wynik = await aktualizujWyposazenieSwietlicy({
        hallId,
        pozycjaId: p.id,
        category: p.category,
        name: p.name,
        description: p.description,
        quantity: p.quantity,
        quantity_available: p.quantity_available,
        condition: p.condition ?? "good",
        inventory_action: akcja,
        width_cm: p.width_cm ?? null,
        length_cm: p.length_cm ?? null,
        height_cm: p.height_cm ?? null,
        notes: p.notes ?? null,
      });
      if ("blad" in wynik) {
        ustawKomunikat({ typ: "blad", tresc: wynik.blad });
        return;
      }
      ustawKomunikat({ typ: "ok", tresc: `Oznaczono: ${ETYKIETY_AKCJI_INWENTARZA[akcja].label}` });
      odswiezListe();
    });
  }

  function dodajPakiet(pakiet: "zebranie_wiejskie" | "warsztaty" | "impreza_rodzinna") {
    startTransition(async () => {
      const wynik = await dodajPakietWyposazeniaSwietlicy({ hallId, pakiet });
      if ("blad" in wynik) {
        ustawKomunikat({ typ: "blad", tresc: wynik.blad });
        return;
      }
      ustawKomunikat({ typ: "ok", tresc: "Dodano pakiet asortymentu." });
      odswiezListe();
    });
  }

  function dodajWow() {
    startTransition(async () => {
      const wynik = await dodajPakietWowWyposazeniaSwietlicy({ hallId });
      if ("blad" in wynik) {
        ustawKomunikat({ typ: "blad", tresc: wynik.blad });
        return;
      }
      ustawKomunikat({ typ: "ok", tresc: "Dodano pakiet WOW — propozycje do rady / budżetu." });
      ustawFiltr("wishlist_wow");
      odswiezListe();
    });
  }

  return (
    <div id="asortyment-swietlicy" className="scroll-mt-24 mt-8 space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-green-950">Asortyment świetlicy</h2>
        <p className="mt-1 text-sm text-stone-600">
          Sala: <strong>{nazwaSali}</strong> — co jest na sali, co do naprawy, usunięcia albo zakupu z efektem WOW.
        </p>
      </div>

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

      <section className="rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/80 via-white to-amber-50/50 p-5 shadow-sm">
        <h3 className="font-serif text-lg text-violet-950">Pakiet WOW ✨</h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          Jednym kliknięciem dodajesz propozycje wyposażenia z efektem „wow” (projektor, nagłośnienie, smart tablica,
          AED…) — jako plan do rady, nie jako rzeczy już na sali.
        </p>
        <button
          type="button"
          disabled={oczekuje}
          onClick={dodajWow}
          className="mt-3 rounded-xl bg-violet-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-900 disabled:opacity-60"
        >
          Dodaj propozycje WOW (6 pozycji)
        </button>
        <EksportPlanWowSwietlicy nazwaSali={nazwaSali} nazwaWsi={nazwaWsi} pozycje={pozycje} />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-serif text-xl text-green-950">Szybki start</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {(
            [
              ["zebranie_wiejskie", "Zebranie wiejskie"],
              ["warsztaty", "Warsztaty"],
              ["impreza_rodzinna", "Impreza rodzinna"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              disabled={oczekuje}
              onClick={() => dodajPakiet(id)}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
            >
              Pakiet: {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-serif text-xl text-green-950">Przegląd stanu</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
            <p className="text-xs text-stone-500">Łącznie sztuk</p>
            <p className="font-semibold">{statystyki.lacznie}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
            <p className="text-xs text-stone-500">Dostępne teraz</p>
            <p className="font-semibold">{statystyki.dostepne}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
            <p className="text-xs text-amber-700">Do naprawy / usunięcia</p>
            <p className="font-semibold text-amber-900">
              {statystyki.poAkcji.to_repair + statystyki.poAkcji.to_remove}
            </p>
          </div>
          <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm">
            <p className="text-xs text-violet-700">Plan WOW</p>
            <p className="font-semibold text-violet-900">{statystyki.poAkcji.wishlist_wow}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => ustawFiltr("wszystko")}
            className={`rounded-full px-3 py-1 text-xs ${filtr === "wszystko" ? "bg-green-800 text-white" : "border border-stone-300 bg-white"}`}
          >
            Wszystko ({pozycje.length})
          </button>
          {AKCJE_INWENTARZA.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => ustawFiltr(a)}
              className={`rounded-full px-3 py-1 text-xs ${filtr === a ? "bg-green-800 text-white" : `border ${ETYKIETY_AKCJI_INWENTARZA[a].cls}`}`}
            >
              {ETYKIETY_AKCJI_INWENTARZA[a].label} ({statystyki.poAkcji[a]})
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-serif text-xl text-green-950">Dodaj pozycję</h3>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onDodaj}>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-name">
              Nazwa
            </label>
            <input id="add-name" name="name" required maxLength={200} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-cat">
              Kategoria / miejsce
            </label>
            <input id="add-cat" name="category" required maxLength={100} defaultValue="Sala główna" className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-action">
              Rekomendacja
            </label>
            <select id="add-action" name="inventory_action" defaultValue="in_use" className="w-full rounded-lg border border-stone-300 px-3 py-2">
              {AKCJE_INWENTARZA.map((a) => (
                <option key={a} value={a}>
                  {ETYKIETY_AKCJI_INWENTARZA[a].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-cond">
              Stan fizyczny
            </label>
            <select id="add-cond" name="condition" defaultValue="good" className="w-full rounded-lg border border-stone-300 px-3 py-2">
              <option value="good">Dobry</option>
              <option value="fair">Do użytku z uwagami</option>
              <option value="damaged">Uszkodzony</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-qty">
              Liczba sztuk
            </label>
            <input id="add-qty" name="quantity" type="number" min={1} required defaultValue={1} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-w">
              Szerokość (cm)
            </label>
            <input id="add-w" name="width_cm" type="number" min={1} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-l">
              Długość / głęb. (cm)
            </label>
            <input id="add-l" name="length_cm" type="number" min={1} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-h">
              Wysokość (cm)
            </label>
            <input id="add-h" name="height_cm" type="number" min={1} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="add-desc">
              Opis
            </label>
            <textarea id="add-desc" name="description" rows={2} maxLength={2000} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={oczekuje} className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {oczekuje ? "Zapisywanie…" : "Dodaj do listy"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="font-serif text-xl text-green-950">Lista ({widoczne.length})</h3>
        {widoczne.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Brak pozycji w tym filtrze.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {widoczne.map((p) => {
              const akcja = normalizujAkcjeInwentarza(p.inventory_action);
              const wym = wymiaryTekst(p);
              return (
                <li key={p.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  {edycjaId === p.id ? (
                    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => onZapiszEdycje(e, p)}>
                      <div className="sm:col-span-2">
                        <input name="name" required defaultValue={p.name} className="w-full rounded-lg border px-3 py-2 text-sm" />
                      </div>
                      <input name="category" required defaultValue={p.category} className="rounded-lg border px-3 py-2 text-sm" />
                      <select name="inventory_action" defaultValue={akcja} className="rounded-lg border px-3 py-2 text-sm">
                        {AKCJE_INWENTARZA.map((a) => (
                          <option key={a} value={a}>
                            {ETYKIETY_AKCJI_INWENTARZA[a].label}
                          </option>
                        ))}
                      </select>
                      <input name="quantity" type="number" min={1} required defaultValue={p.quantity} className="rounded-lg border px-3 py-2 text-sm" />
                      <input name="quantity_available" type="number" min={0} defaultValue={liczbaDostepna(p)} className="rounded-lg border px-3 py-2 text-sm" />
                      <input name="width_cm" type="number" placeholder="szer. cm" defaultValue={p.width_cm ?? ""} className="rounded-lg border px-3 py-2 text-sm" />
                      <input name="length_cm" type="number" placeholder="gł. cm" defaultValue={p.length_cm ?? ""} className="rounded-lg border px-3 py-2 text-sm" />
                      <select name="condition" defaultValue={p.condition ?? "good"} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="good">Dobry</option>
                        <option value="fair">Do użytku z uwagami</option>
                        <option value="damaged">Uszkodzony</option>
                      </select>
                      <textarea name="description" rows={2} defaultValue={p.description ?? ""} className="sm:col-span-2 rounded-lg border px-3 py-2 text-sm" />
                      <div className="flex gap-2 sm:col-span-2">
                        <button type="submit" disabled={oczekuje} className="rounded-lg bg-green-800 px-3 py-1.5 text-sm text-white">
                          Zapisz
                        </button>
                        <button type="button" onClick={() => ustawEdycjaId(null)} className="rounded-lg border px-3 py-1.5 text-sm">
                          Anuluj
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 gap-3">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                          ) : null}
                          <div>
                            <p className="font-medium text-stone-900">{p.name}</p>
                            <p className="text-xs text-stone-500">
                              {p.category} · szt.: {p.quantity}, wolne: {liczbaDostepna(p)}
                              {wym ? ` · ${wym}` : ""}
                            </p>
                            <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${ETYKIETY_AKCJI_INWENTARZA[akcja].cls}`}>
                              {ETYKIETY_AKCJI_INWENTARZA[akcja].label}
                            </span>
                            {p.description ? <p className="mt-2 text-sm text-stone-600">{p.description}</p> : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <button type="button" onClick={() => ustawEdycjaId(p.id)} className="rounded border px-2 py-1 text-xs">
                            Edytuj
                          </button>
                          <button type="button" onClick={() => onUsun(p.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-800">
                            Usuń
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1 border-t border-stone-100 pt-2">
                        <span className="text-[10px] uppercase text-stone-400">Szybko:</span>
                        {akcja !== "to_repair" ? (
                          <button type="button" disabled={oczekuje} onClick={() => szybkaAkcja(p, "to_repair")} className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px]">
                            Do naprawy
                          </button>
                        ) : null}
                        {akcja !== "to_remove" ? (
                          <button type="button" disabled={oczekuje} onClick={() => szybkaAkcja(p, "to_remove")} className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px]">
                            Do usunięcia
                          </button>
                        ) : null}
                        {akcja !== "wishlist_wow" ? (
                          <button type="button" disabled={oczekuje} onClick={() => szybkaAkcja(p, "wishlist_wow")} className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px]">
                            Plan WOW
                          </button>
                        ) : null}
                        {akcja !== "in_use" ? (
                          <button type="button" disabled={oczekuje} onClick={() => szybkaAkcja(p, "in_use")} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px]">
                            Zostawiamy
                          </button>
                        ) : null}
                      </div>
                      <ZdjecieAsortymentu hallId={hallId} pozycjaId={p.id} imageUrl={p.image_url} />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
