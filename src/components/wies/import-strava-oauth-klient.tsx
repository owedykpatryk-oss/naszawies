"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  importujAktywnoscZeStravaOAuth,
  pobierzListeAktywnosciStravaDoImportu,
  pobierzStatusStravaFitness,
  rozlaczKontoStravaFitness,
  type AktywnoscStravaDoImportu,
} from "@/app/(site)/wies/akcje-strava-fitness";
import { urlPolaczeniaStrava } from "@/lib/strava/url-polaczenia";
import { formatujCzas, formatujDystans } from "@/lib/wies/aktywnosc-fitness-wspolne";
import { PrzyciskLadowania } from "@/components/ui/przycisk-ladowania";

type Props = {
  villageId: string;
  kluby: Array<{ id: string; name: string }>;
};

export function ImportStravaOAuthKlient({ villageId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startT] = useTransition();
  const [laduje, ustawLaduje] = useState(true);
  const [skonfigurowana, ustawSkonfigurowana] = useState(false);
  const [polaczone, ustawPolaczone] = useState(false);
  const [athleteName, ustawAthleteName] = useState<string | null>(null);
  const [lista, ustawListe] = useState<AktywnoscStravaDoImportu[]>([]);
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");

  const returnTo = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}#sekcja-sport`;

  const odswiez = useCallback(async () => {
    ustawBlad("");
    const status = await pobierzStatusStravaFitness();
    ustawSkonfigurowana(status.skonfigurowana);
    ustawPolaczone(status.polaczone);
    ustawAthleteName(status.athleteName);
    if (status.skonfigurowana && status.polaczone) {
      const w = await pobierzListeAktywnosciStravaDoImportu(villageId);
      if ("blad" in w) {
        ustawBlad(w.blad);
        ustawListe([]);
      } else {
        ustawListe(w.aktywnosci);
      }
    } else {
      ustawListe([]);
    }
    ustawLaduje(false);
  }, [villageId]);

  useEffect(() => {
    odswiez();
  }, [odswiez]);

  useEffect(() => {
    const s = searchParams?.get("strava");
    if (s === "polaczono") {
      ustawKomunikat("Połączono konto Strava — wybierz aktywność do opublikowania.");
      router.replace(returnTo.split("#")[0] + "#sekcja-sport", { scroll: false });
    }
  }, [searchParams, router, returnTo]);

  if (laduje) {
    return <p className="text-xs text-stone-500">Sprawdzam połączenie ze Strava…</p>;
  }

  if (!skonfigurowana) {
    return null;
  }

  if (!polaczone) {
    return (
      <div className="mt-4 rounded-lg border border-orange-200/80 bg-orange-50/50 p-4">
        <p className="text-sm font-medium text-orange-950">Import z konta Strava</p>
        <p className="mt-1 text-xs text-stone-600">
          Połącz konto, aby jednym kliknięciem dodać ostatnie treningi (OAuth — zgodnie z API Strava v3).
        </p>
        <a
          href={urlPolaczeniaStrava(villageId, returnTo)}
          className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#fc4c02] px-4 text-sm font-medium text-white hover:bg-[#e34402]"
        >
          Połącz ze Strava
        </a>
      </div>
    );
  }

  function importuj(id: number) {
    ustawBlad("");
    ustawKomunikat("");
    startT(async () => {
      const w = await importujAktywnoscZeStravaOAuth({ villageId, stravaActivityId: id });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Zaimportowano aktywność ze Strava.");
      await odswiez();
      router.refresh();
    });
  }

  function rozlacz() {
    if (!confirm("Odłączyć konto Strava?")) return;
    startT(async () => {
      const w = await rozlaczKontoStravaFitness();
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      await odswiez();
    });
  }

  return (
    <div className="mt-4 rounded-lg border border-orange-200/80 bg-orange-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-orange-950">
            Strava{athleteName ? ` · ${athleteName}` : ""}
          </p>
          <p className="mt-1 text-xs text-stone-600">Ostatnie treningi z Twojego konta — kliknij „Dodaj”.</p>
        </div>
        <button type="button" onClick={rozlacz} disabled={pending} className="text-xs text-stone-500 underline hover:text-red-700">
          Odłącz
        </button>
      </div>

      {lista.length === 0 ? (
        <p className="mt-3 text-xs text-stone-500">Brak nowych aktywności do importu.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lista.map((a) => {
            const meta = [formatujDystans(a.distance_meters), formatujCzas(a.duration_seconds)]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white bg-white/90 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">{a.name}</p>
                  <p className="text-xs text-stone-600">
                    {new Date(a.start_date_local).toLocaleString("pl-PL", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {meta ? ` · ${meta}` : ""}
                    {a.sport_type ? ` · ${a.sport_type}` : ""}
                  </p>
                </div>
                {a.juzZaimportowana ? (
                  <span className="text-xs text-green-800">Dodano ✓</span>
                ) : (
                  <PrzyciskLadowania
                    laduje={pending}
                    tekst="Dodaj"
                    tekstLadowania="…"
                    wariant="secondary"
                    className="!px-3 !py-1 text-xs"
                    onClick={() => importuj(a.id)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {komunikat ? <p className="mt-2 text-xs text-green-800">{komunikat}</p> : null}
      {blad ? <p className="mt-2 text-xs text-red-700">{blad}</p> : null}
    </div>
  );
}
