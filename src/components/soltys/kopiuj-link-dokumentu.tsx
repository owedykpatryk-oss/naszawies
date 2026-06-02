"use client";

import { useCallback, useState } from "react";

type Props = {
  presetId: string;
};

export function KopiujLinkDokumentu({ presetId }: Props) {
  const [ok, ustawOk] = useState(false);

  const kopiuj = useCallback(async () => {
    const params = new URLSearchParams({ preset: presetId });
    const url = `${window.location.origin}/panel/soltys/dokumenty?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      ustawOk(true);
      window.setTimeout(() => ustawOk(false), 2500);
    } catch {
      window.prompt("Skopiuj link:", url);
    }
  }, [presetId]);

  return (
    <button
      type="button"
      onClick={() => void kopiuj()}
      className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
    >
      {ok ? "Skopiowano link ✓" : "Kopiuj link do dokumentu"}
    </button>
  );
}
