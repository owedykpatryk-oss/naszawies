"use client";

import { FormEvent, useState, useTransition } from "react";
import { zapiszPolaRezerwacjiSali } from "@/app/(site)/panel/soltys/akcje";
import { nowePoleRezerwacji, type PoleRezerwacjiSali, type TypPolaRezerwacji } from "@/lib/swietlica/pola-rezerwacji";

export function EdytorPolRezerwacjiKlient({
  hallId,
  poczatkowe,
}: {
  hallId: string;
  poczatkowe: PoleRezerwacjiSali[];
}) {
  const [pola, ustawPola] = useState<PoleRezerwacjiSali[]>(poczatkowe);
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);
  const [czek, startT] = useTransition();

  function wyslij(e: FormEvent) {
    e.preventDefault();
    ustawBlad("");
    ustawOk(false);
    const oczyszczone = pola
      .filter((p) => p.label.trim())
      .map((p) => ({
        ...p,
        label: p.label.trim(),
        placeholder: p.placeholder?.trim() || null,
        opcje:
          p.typ === "select"
            ? (p.opcje ?? [])
                .map((o) => o.trim())
                .filter(Boolean)
                .slice(0, 12)
            : null,
      }));
    startT(async () => {
      const wynik = await zapiszPolaRezerwacjiSali({ hallId, pola: oczyszczone });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawOk(true);
    });
  }

  return (
    <form onSubmit={wyslij} className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="font-serif text-lg text-green-950">Własne pola formularza rezerwacji</h3>
      <p className="mt-1 text-sm text-stone-600">
        Dodaj pytania specyficzne dla Twojej świetlicy (np. numer dowodu, cel wydarzenia). Maks. 8 pól.
      </p>

      <ul className="mt-4 space-y-3">
        {pola.map((pole, i) => (
          <li key={pole.id} className="rounded-lg border border-stone-200 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="form-control"
                placeholder="Etykieta pola"
                value={pole.label}
                onChange={(e) => ustawPola((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <select
                className="form-control"
                value={pole.typ}
                onChange={(e) =>
                  ustawPola((arr) =>
                    arr.map((x, j) =>
                      j === i ? { ...x, typ: e.target.value as TypPolaRezerwacji, opcje: e.target.value === "select" ? x.opcje ?? [""] : null } : x,
                    ),
                  )
                }
              >
                <option value="text">Krótki tekst</option>
                <option value="textarea">Dłuższy opis</option>
                <option value="number">Liczba</option>
                <option value="checkbox">Checkbox (tak/nie)</option>
                <option value="select">Lista wyboru</option>
              </select>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  className="accent-green-800"
                  checked={pole.wymagane}
                  onChange={(e) => ustawPola((arr) => arr.map((x, j) => (j === i ? { ...x, wymagane: e.target.checked } : x)))}
                />
                Pole wymagane
              </label>
              {pole.typ !== "checkbox" && pole.typ !== "select" ? (
                <input
                  className="form-control sm:col-span-2"
                  placeholder="Podpowiedź (placeholder, opcj.)"
                  value={pole.placeholder ?? ""}
                  onChange={(e) => ustawPola((arr) => arr.map((x, j) => (j === i ? { ...x, placeholder: e.target.value || null } : x)))}
                />
              ) : null}
              {pole.typ === "select" ? (
                <textarea
                  className="form-control form-control--textarea sm:col-span-2"
                  rows={2}
                  placeholder="Opcje — jedna na linię"
                  value={(pole.opcje ?? []).join("\n")}
                  onChange={(e) =>
                    ustawPola((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, opcje: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) } : x,
                      ),
                    )
                  }
                />
              ) : null}
            </div>
            <button type="button" className="mt-2 text-xs text-red-700 underline" onClick={() => ustawPola((arr) => arr.filter((_, j) => j !== i))}>
              Usuń pole
            </button>
          </li>
        ))}
      </ul>

      {pola.length < 8 ? (
        <button type="button" className="mt-3 text-sm font-medium text-green-800 underline" onClick={() => ustawPola((p) => [...p, nowePoleRezerwacji()])}>
          + Dodaj pole
        </button>
      ) : null}

      {blad ? <p className="mt-3 text-sm text-red-700">{blad}</p> : null}
      {ok ? <p className="mt-3 text-sm text-green-800">Zapisano pola formularza.</p> : null}

      <button type="submit" disabled={czek} className="mt-4 rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {czek ? "Zapisywanie…" : "Zapisz pola rezerwacji"}
      </button>
    </form>
  );
}
