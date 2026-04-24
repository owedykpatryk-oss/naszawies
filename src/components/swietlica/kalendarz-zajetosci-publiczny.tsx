import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";

export type WierszKalendarzaPublicznego = {
  hall_id: string;
  hall_name: string;
  start_at: string;
  end_at: string;
  status: "pending" | "approved" | string;
};

function etykietujStatus(s: string): { krotka: string; opis: string } {
  if (s === "pending") {
    return {
      krotka: "Wstępna rezerwacja",
      opis: "Wniosek oczekuje na sołtysa (termin wstępnie zablokowany; bez danych wynajmującego w widoku publicznym).",
    };
  }
  if (s === "approved") {
    return { krotka: "Zajęte (potwierdzone)", opis: "Sala w tym przedziale ma potwierdzoną rezerwację." };
  }
  return { krotka: s, opis: "" };
}

function formatZakres(a: string, b: string) {
  const s = new Date(a).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  const e = new Date(b).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  return `${s} — ${e}`;
}

export async function pobierzKalendarzZajetosciDlaHali(
  supabase: SupabaseClient,
  hallId: string
): Promise<{ start_at: string; end_at: string; status: string }[]> {
  const { data, error } = await supabase.rpc("hall_kalendarz_zajetosci_publiczny", {
    p_hall_id: hallId,
  });
  if (error) {
    console.error("[pobierzKalendarzZajetosciDlaHali]", error.message);
    return [];
  }
  return (data ?? []) as { start_at: string; end_at: string; status: string }[];
}

export async function pobierzKalendarzZajetosciDlaWsi(
  supabase: SupabaseClient,
  villageId: string
): Promise<WierszKalendarzaPublicznego[]> {
  const { data, error } = await supabase.rpc("wies_kalendarz_zajetosci_sal_publiczny", {
    p_village_id: villageId,
  });
  if (error) {
    console.error("[pobierzKalendarzZajetosciDlaWsi]", error.message);
    return [];
  }
  return (data ?? []) as WierszKalendarzaPublicznego[];
}

type PropsHala = {
  tytul?: string;
  wiersze: { start_at: string; end_at: string; status: string }[];
  naglowekDod?: ReactNode;
  pustyKomunikat?: string;
};

/** Jedna świetlica: terminy „zajęte” bez wynajmującego. */
export function KalendarzZajetosciDlaHaliSekcja({
  tytul = "Zajęte terminy (kalendarz)",
  wiersze,
  naglowekDod,
  pustyKomunikat = "W tym miejscu nie ma wstępnie zablokowanych ani zatwierdzonych rezerwacji w wyświetlanym widoku. Imię i dane wynajmującego widać tylko w panelu sołtysa.",
}: PropsHala) {
  return (
    <section className="mt-10 rounded-2xl border border-stone-200 bg-stone-50/80 p-5 sm:p-6" aria-label="Kalendarz zajętości sali">
      <h2 className="font-serif text-xl text-green-950">{tytul}</h2>
      {naglowekDod ? <div className="mt-2 text-sm text-stone-600">{naglowekDod}</div> : null}
      {wiersze.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">{pustyKomunikat}</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm text-stone-800">
          {wiersze.map((r, i) => {
            const etyk = etykietujStatus(r.status);
            return (
              <li key={`${r.start_at}-${i}`} className="rounded-lg border border-stone-200 bg-white px-3 py-2">
                <p className="font-medium text-stone-900">{etyk.krotka}</p>
                <p className="text-stone-800">{formatZakres(r.start_at, r.end_at)}</p>
                {etyk.opis ? <p className="mt-1 text-xs text-stone-500">{etyk.opis}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type PropsWies = { wies: { name: string }; wiersze: WierszKalendarzaPublicznego[] };

/** Profil wsi: wiele sal — tylko przedziały, bez wynajmujących. */
export function KalendarzZajetosciWsiSekcja({ wies, wiersze }: PropsWies) {
  if (wiersze.length === 0) {
    return (
      <section className="mt-8 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-4 text-sm text-stone-700">
        <p className="font-medium text-stone-900">Kalendarz świetlic</p>
        <p className="mt-2">
          Brak publicznie widocznych zajętych przedziałów (lub w sołectwie nie włączono w systemie sal). Po zalogowaniu
          i akceptacji roli mieszkańca w tej wsi w panelu widać własne rezerwacje; pełna lista wniosków — u sołtysa w
          panelu obiegu.
        </p>
        <p className="mt-2 text-xs text-stone-500">Na tym ekranie nie podajemy, kto zajął salę — tylko że termin jest zajęty albo czeka na sołtysa.</p>
      </section>
    );
  }
  return (
    <section className="mt-8 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-4" aria-label="Kalendarz zajętości świetlic wsi">
      <p className="font-medium text-stone-900">Kalendarz świetlic (bez danych wynajmujących)</p>
      <p className="mt-1 text-sm text-stone-600">
        {wies.name} — tylko przedziały czasowe, bez imion i tematów. Tylko sołtys widzi, kto dokładnie wynajął salę w panelu
        rezerwacji.
      </p>
      <ul className="mt-4 space-y-3 text-sm text-stone-800">
        {wiersze.map((r, i) => {
          const etyk = etykietujStatus(r.status);
          return (
            <li
              key={`${r.hall_id}-${r.start_at}-${i}`}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2"
            >
              <p className="text-xs font-semibold text-stone-500">{r.hall_name}</p>
              <p className="font-medium text-stone-900">{etyk.krotka}</p>
              <p className="text-stone-800">{formatZakres(r.start_at, r.end_at)}</p>
            </li>
          );
         })}
      </ul>
    </section>
  );
}
