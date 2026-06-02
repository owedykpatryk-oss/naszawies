"use client";

import { useCallback, useState } from "react";
import { zbudujLinkGrafiki } from "@/lib/grafika/link-grafika";

type Props = {
  szablonId: string;
  motywId?: string;
  tryb?: "zaproszenie" | "dyplomy";
  wartosci?: Record<string, string>;
  tytulProjektu?: string;
  sciezka?: string;
};

export function KopiujLinkProjektu({
  szablonId,
  motywId,
  tryb = "zaproszenie",
  wartosci,
  tytulProjektu,
  sciezka,
}: Props) {
  const [ok, ustawOk] = useState(false);

  const kopiuj = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${zbudujLinkGrafiki({
            sciezka: sciezka ?? "/panel/soltys/grafika",
            szablon: szablonId,
            motyw: motywId,
            tryb,
            wartosci,
            tytulProjektu,
          })}`
        : zbudujLinkGrafiki({ szablon: szablonId, motyw: motywId, tryb, wartosci, tytulProjektu, sciezka });
    try {
      await navigator.clipboard.writeText(url);
      ustawOk(true);
      window.setTimeout(() => ustawOk(false), 2500);
    } catch {
      window.prompt("Skopiuj link:", url);
    }
  }, [szablonId, motywId, tryb, wartosci, tytulProjektu, sciezka]);

  const maTresc = wartosci && Object.values(wartosci).some((v) => v?.trim());

  return (
    <button
      type="button"
      onClick={() => void kopiuj()}
      className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
      title={maTresc ? "Link zawiera wypełnioną treść" : "Link tylko do szablonu"}
    >
      {ok ? "Skopiowano link ✓" : maTresc ? "Kopiuj link z treścią" : "Kopiuj link do szablonu"}
    </button>
  );
}
