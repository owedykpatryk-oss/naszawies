"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zapiszPrzewodnikSamorzadowyWsi } from "../akcje";

export type WiesDoSamorzadu = { id: string; name: string };

export type PrzewodnikWiersz = {
  village_id: string;
  commune_info: string | null;
  county_info: string | null;
  voivodeship_info: string | null;
  roads_info: string | null;
  waste_info: string | null;
  utilities_info: string | null;
  other_info: string | null;
};

export function SoltysSamorzadKlient({
  wsie,
  wpisy,
}: {
  wsie: WiesDoSamorzadu[];
  wpisy: PrzewodnikWiersz[];
}) {
  const router = useRouter();
  const [villageId, setVillageId] = useState(wsie[0]?.id ?? "");
  const [czek, startT] = useTransition();
  const [komunikat, setKomunikat] = useState("");
  const [blad, setBlad] = useState("");

  const wpisDlaWsi = useMemo(
    () => wpisy.find((w) => w.village_id === villageId),
    [wpisy, villageId],
  );

  function onZapisz(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const wynik = await zapiszPrzewodnikSamorzadowyWsi({
        villageId,
        commune_info: String(fd.get("commune_info") ?? ""),
        county_info: String(fd.get("county_info") ?? ""),
        voivodeship_info: String(fd.get("voivodeship_info") ?? ""),
        roads_info: String(fd.get("roads_info") ?? ""),
        waste_info: String(fd.get("waste_info") ?? ""),
        utilities_info: String(fd.get("utilities_info") ?? ""),
        other_info: String(fd.get("other_info") ?? ""),
      });
      if ("blad" in wynik && wynik.blad) {
        setBlad(wynik.blad);
        return;
      }
      setKomunikat("Zapisano przewodnik — profil wsi został odświeżony.");
      router.refresh();
    });
  }

  const nazwa = wsie.find((w) => w.id === villageId)?.name ?? "Wybrana wieś";

  return (
    <section className="mt-6 space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-stone-800" htmlFor="wies-samorzad">
          Wieś
        </label>
        <select
          id="wies-samorzad"
          className="mt-2 w-full max-w-sm rounded border border-stone-300 px-3 py-2 text-sm"
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-stone-500">Edycja przewodnika dla: {nazwa}.</p>
        {komunikat ? (
          <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{komunikat}</p>
        ) : null}
        {blad ? <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{blad}</p> : null}
      </div>

      <form onSubmit={onZapisz} className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/40 p-5 shadow-sm">
        <p className="text-sm text-stone-600">
          Telefony do urzędu gminy, linki BIP, harmonogram śmieci, zgłaszanie dziur — treść pojawi się na publicznym
          profilu wsi w sekcji „Gmina, powiat, województwo”.
        </p>
        <label className="block text-sm font-medium text-stone-800">
          Gmina — kontakty i sprawy
          <textarea
            name="commune_info"
            key={`c-${villageId}`}
            defaultValue={wpisDlaWsi?.commune_info ?? ""}
            rows={5}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Powiat — kontakty i sprawy
          <textarea
            name="county_info"
            key={`co-${villageId}`}
            defaultValue={wpisDlaWsi?.county_info ?? ""}
            rows={4}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Województwo — kontakty i sprawy
          <textarea
            name="voivodeship_info"
            key={`v-${villageId}`}
            defaultValue={wpisDlaWsi?.voivodeship_info ?? ""}
            rows={3}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Drogi i dojazdy (lokalnie)
          <textarea
            name="roads_info"
            key={`r-${villageId}`}
            defaultValue={wpisDlaWsi?.roads_info ?? ""}
            rows={4}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Śmieci, PSZOK, środowisko
          <textarea
            name="waste_info"
            key={`w-${villageId}`}
            defaultValue={wpisDlaWsi?.waste_info ?? ""}
            rows={3}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Woda, prąd, operatorzy
          <textarea
            name="utilities_info"
            key={`u-${villageId}`}
            defaultValue={wpisDlaWsi?.utilities_info ?? ""}
            rows={3}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Inne (OSP, straż, koordynacja)
          <textarea
            name="other_info"
            key={`o-${villageId}`}
            defaultValue={wpisDlaWsi?.other_info ?? ""}
            rows={3}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={czek || !villageId}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-60"
        >
          Zapisz na profil wsi
        </button>
      </form>
    </section>
  );
}
