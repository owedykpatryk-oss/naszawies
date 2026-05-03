"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WyszukiwarkaWsi } from "@/components/wies/wyszukiwarka-wsi";
import { etykietaRoliWsi } from "@/lib/panel/role-definicje";
import {
  obserwujWies,
  zlozWniosekMieszkaniec,
  zlozWniosekRoleOrganizacyjnej,
  type RolaOrgWniosku,
  type WynikProsty,
} from "./akcje";

export function MieszkaniecKlient() {
  const router = useRouter();
  const [komunikat, ustawKomunikat] = useState("");
  const [rolaOrg, ustawRolaOrg] = useState<RolaOrgWniosku>("osp_naczelnik");

  async function obsluz(wynik: WynikProsty) {
    if ("blad" in wynik) {
      ustawKomunikat(wynik.blad);
      return;
    }
    ustawKomunikat(wynik.komunikat ?? "Zapisano.");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {komunikat ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {komunikat}
        </p>
      ) : null}

      <section id="dolacz-mieszkaniec" className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Dołącz do wsi jako mieszkaniec</h2>
        <p className="mt-1 text-sm text-stone-600">
          Złóż wniosek — sołtys zatwierdzi Cię w panelu. Potrzebujesz aktywnej roli, by widzieć ogłoszenia i świetlicę
          swojej wsi.
        </p>
        <div className="mt-4">
          <WyszukiwarkaWsi
            etykietaAkcji="Wyszukaj miejscowość i wyślij wniosek"
            tekstPrzycisku="Wyślij wniosek"
            onAkcja={async (w) => {
              ustawKomunikat("");
              await obsluz(await zlozWniosekMieszkaniec(w.id));
            }}
          />
        </div>
      </section>

      <section id="wnioski-org" className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Wniosek o rolę OSP, KGW lub radę sołecką</h2>
        <p className="mt-1 text-sm text-stone-600">
          Dla każdej wsi może być tylko jedna aktywna osoba na stanowisko (np. jeden naczelnik OSP). Sołtys zatwierdza wniosek
          w panelu — uczciwie złóż wniosek tylko jeśli faktycznie pełnisz tę funkcję.
        </p>
        <label className="mt-4 block text-sm font-medium text-stone-800">
          Typ wniosku
          <select
            className="mt-1 block w-full max-w-md rounded border border-stone-300 bg-white px-3 py-2 text-sm"
            value={rolaOrg}
            onChange={(e) => ustawRolaOrg(e.target.value as RolaOrgWniosku)}
          >
            <option value="osp_naczelnik">{etykietaRoliWsi("osp_naczelnik")}</option>
            <option value="kgw_przewodniczaca">{etykietaRoliWsi("kgw_przewodniczaca")}</option>
            <option value="rada_solecka">{etykietaRoliWsi("rada_solecka")}</option>
          </select>
        </label>
        <div className="mt-4">
          <WyszukiwarkaWsi
            etykietaAkcji="Wybierz wieś i wyślij wniosek o wybraną rolę"
            tekstPrzycisku="Wyślij wniosek"
            onAkcja={async (w) => {
              ustawKomunikat("");
              await obsluz(await zlozWniosekRoleOrganizacyjnej(w.id, rolaOrg));
            }}
          />
        </div>
      </section>

      <section id="obserwuj-wies" className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Obserwuj wieś</h2>
        <p className="mt-1 text-sm text-stone-600">
          Dodaj wieś do obserwowanych, aby szybciej dostawać informacje i powiadomienia.
        </p>
        <div className="mt-4">
          <WyszukiwarkaWsi
            etykietaAkcji="Wybierz wieś, którą chcesz obserwować"
            tekstPrzycisku="Obserwuj"
            onAkcja={async (w) => {
              ustawKomunikat("");
              await obsluz(await obserwujWies(w.id));
            }}
          />
        </div>
      </section>
    </div>
  );
}
