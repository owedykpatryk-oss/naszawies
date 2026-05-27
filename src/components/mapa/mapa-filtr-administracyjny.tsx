"use client";

import { useMemo } from "react";
import { slugCzesciZBazy } from "@/lib/wies/slug-administracyjny";
import type { ZnacznikWsi } from "./mapa-wsi-leaflet";

export type FiltrAdministracyjny = {
  wojSlug: string;
  powSlug: string;
  gminaSlug: string;
};

type Element = { slug: string; nazwa: string; liczba: number };

type Props = {
  znaczniki: ZnacznikWsi[];
  filtr: FiltrAdministracyjny;
  onZmiana: (f: FiltrAdministracyjny) => void;
};

const stylSelect =
  "min-h-[40px] w-full rounded-xl border border-stone-200/90 bg-white/90 px-3 py-2 text-sm text-stone-900 shadow-sm outline-none ring-green-800/20 transition focus:border-green-600 focus:ring-2 focus:ring-green-700/25";

function unikalneWoj(znaczniki: ZnacznikWsi[]): Element[] {
  const mapa = new Map<string, { nazwa: string; liczba: number }>();
  for (const z of znaczniki) {
    if (!z.voivodeship) continue;
    const slug = slugCzesciZBazy(z.voivodeship);
    const prev = mapa.get(slug);
    if (prev) prev.liczba += 1;
    else mapa.set(slug, { nazwa: z.voivodeship, liczba: 1 });
  }
  return Array.from(mapa.entries())
    .map(([slug, v]) => ({ slug, nazwa: v.nazwa, liczba: v.liczba }))
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));
}

function unikalnePowiaty(znaczniki: ZnacznikWsi[], wojSlug: string): Element[] {
  if (!wojSlug) return [];
  const mapa = new Map<string, { nazwa: string; liczba: number }>();
  for (const z of znaczniki) {
    if (!z.voivodeship || !z.county) continue;
    if (slugCzesciZBazy(z.voivodeship) !== wojSlug) continue;
    const slug = slugCzesciZBazy(z.county);
    const prev = mapa.get(slug);
    if (prev) prev.liczba += 1;
    else mapa.set(slug, { nazwa: z.county, liczba: 1 });
  }
  return Array.from(mapa.entries())
    .map(([slug, v]) => ({ slug, nazwa: v.nazwa, liczba: v.liczba }))
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));
}

function unikalneGminy(znaczniki: ZnacznikWsi[], wojSlug: string, powSlug: string): Element[] {
  if (!wojSlug || !powSlug) return [];
  const mapa = new Map<string, { nazwa: string; liczba: number }>();
  for (const z of znaczniki) {
    if (!z.voivodeship || !z.county || !z.commune) continue;
    if (slugCzesciZBazy(z.voivodeship) !== wojSlug) continue;
    if (slugCzesciZBazy(z.county) !== powSlug) continue;
    const slug = slugCzesciZBazy(z.commune);
    const prev = mapa.get(slug);
    if (prev) prev.liczba += 1;
    else mapa.set(slug, { nazwa: z.commune, liczba: 1 });
  }
  return Array.from(mapa.entries())
    .map(([slug, v]) => ({ slug, nazwa: v.nazwa, liczba: v.liczba }))
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));
}

/** Filtruje znaczniki po slugach woj/pow/gmina (puste = bez filtra na danym poziomie). */
export function filtrujZnacznikiAdministracyjnie(
  znaczniki: ZnacznikWsi[],
  filtr: FiltrAdministracyjny,
): ZnacznikWsi[] {
  return znaczniki.filter((z) => {
    if (filtr.wojSlug && slugCzesciZBazy(z.voivodeship ?? "") !== filtr.wojSlug) return false;
    if (filtr.powSlug && slugCzesciZBazy(z.county ?? "") !== filtr.powSlug) return false;
    if (filtr.gminaSlug && slugCzesciZBazy(z.commune ?? "") !== filtr.gminaSlug) return false;
    return true;
  });
}

export function MapaFiltrAdministracyjny({ znaczniki, filtr, onZmiana }: Props) {
  const wojewodztwa = useMemo(() => unikalneWoj(znaczniki), [znaczniki]);
  const powiaty = useMemo(() => unikalnePowiaty(znaczniki, filtr.wojSlug), [znaczniki, filtr.wojSlug]);
  const gminy = useMemo(
    () => unikalneGminy(znaczniki, filtr.wojSlug, filtr.powSlug),
    [znaczniki, filtr.wojSlug, filtr.powSlug],
  );

  return (
    <div className="grid gap-2">
      <div>
        <label htmlFor="mapa-woj" className="mb-1 block text-[11px] font-medium text-stone-600">
          Województwo
        </label>
        <select
          id="mapa-woj"
          value={filtr.wojSlug}
          onChange={(e) =>
            onZmiana({ wojSlug: e.target.value, powSlug: "", gminaSlug: "" })
          }
          className={stylSelect}
        >
          <option value="">— wszystkie —</option>
          {wojewodztwa.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.nazwa} ({e.liczba})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="mapa-pow" className="mb-1 block text-[11px] font-medium text-stone-600">
          Powiat
        </label>
        <select
          id="mapa-pow"
          value={filtr.powSlug}
          onChange={(e) => onZmiana({ ...filtr, powSlug: e.target.value, gminaSlug: "" })}
          disabled={!filtr.wojSlug}
          className={stylSelect}
        >
          <option value="">{filtr.wojSlug ? "— wszystkie —" : "Najpierw województwo"}</option>
          {powiaty.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.nazwa} ({e.liczba})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="mapa-gmina" className="mb-1 block text-[11px] font-medium text-stone-600">
          Gmina
        </label>
        <select
          id="mapa-gmina"
          value={filtr.gminaSlug}
          onChange={(e) => onZmiana({ ...filtr, gminaSlug: e.target.value })}
          disabled={!filtr.powSlug}
          className={stylSelect}
        >
          <option value="">{filtr.powSlug ? "— wszystkie —" : "Najpierw powiat"}</option>
          {gminy.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.nazwa} ({e.liczba})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
