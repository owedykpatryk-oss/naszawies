"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { WyszukiwarkaWsi } from "@/components/wies/wyszukiwarka-wsi";
import { obserwujGmine, type WynikProsty } from "@/app/(site)/panel/moje/akcje";

type GminaKlucz = { wojewodztwo: string; powiat: string; gmina: string; sciezkaHub: string };

export function MojeDodajGmineKlient({ juzObserwowane }: { juzObserwowane: GminaKlucz[] }) {
  const router = useRouter();
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [ostatnieGminy, ustawOstatnieGminy] = useState<GminaKlucz[]>([]);

  const kluczeJuz = useMemo(
    () => new Set(juzObserwowane.map((g) => `${g.wojewodztwo}|${g.powiat}|${g.gmina}`)),
    [juzObserwowane],
  );

  async function obsluz(wynik: WynikProsty) {
    ustawBlad("");
    if ("blad" in wynik) {
      ustawBlad(wynik.blad);
      return;
    }
    ustawKomunikat(wynik.komunikat ?? "Zapisano.");
    router.refresh();
  }

  function dodajZGminyWsi(wojewodztwo: string, powiat: string, gmina: string) {
    const klucz = `${wojewodztwo}|${powiat}|${gmina}`;
    if (kluczeJuz.has(klucz)) {
      ustawBlad("Ta gmina jest już na liście obserwowanych.");
      return;
    }
    const wpis: GminaKlucz = { wojewodztwo, powiat, gmina, sciezkaHub: "" };
    ustawOstatnieGminy((prev) => {
      if (prev.some((p) => `${p.wojewodztwo}|${p.powiat}|${p.gmina}` === klucz)) return prev;
      return [wpis, ...prev].slice(0, 6);
    });
  }

  return (
    <section className="rounded-2xl border border-dashed border-sky-300/80 bg-sky-50/30 p-5">
      <h2 className="font-serif text-lg text-green-950">Obserwuj gminę (bez przypisanej wsi)</h2>
      <p className="mt-1 text-sm text-stone-600">
        Wyszukaj dowolną wieś — wybierz gminę z wyniku. W feedzie „Co nowego” zobaczysz też aktualności z innych miejscowości
        w tej gminie.
      </p>
      {komunikat ? (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {komunikat}
        </p>
      ) : null}
      {blad ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {blad}
        </p>
      ) : null}
      <div className="mt-4">
        <WyszukiwarkaWsi
          etykietaAkcji="Wyszukaj wieś, aby wybrać gminę"
          tekstPrzycisku="Wybierz gminę"
          onAkcja={async (w) => {
            ustawKomunikat("");
            dodajZGminyWsi(w.wojewodztwo, w.powiat, w.gmina);
            await obsluz(await obserwujGmine(w.wojewodztwo, w.powiat, w.gmina));
          }}
        />
      </div>
      {ostatnieGminy.length > 0 ? (
        <p className="mt-3 text-xs text-stone-500">
          Ostatnio dodane z wyszukiwarki:{" "}
          {ostatnieGminy.map((g) => `${g.gmina} (${g.powiat})`).join(", ")}
        </p>
      ) : null}
    </section>
  );
}
