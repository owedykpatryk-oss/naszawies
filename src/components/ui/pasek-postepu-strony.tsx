"use client";

import { useEffect, useState } from "react";

/** Cienki pasek postępu czytania u góry strony (profil wsi, długie artykuły). */
export function PasekPostepuStrony() {
  const [postep, ustawPostep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function aktualizuj() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      ustawPostep(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    }

    aktualizuj();
    window.addEventListener("scroll", aktualizuj, { passive: true });
    window.addEventListener("resize", aktualizuj);
    return () => {
      window.removeEventListener("scroll", aktualizuj);
      window.removeEventListener("resize", aktualizuj);
    };
  }, []);

  if (postep <= 0.001) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[45] h-[3px] origin-left bg-transparent"
      style={{ top: "var(--site-header-height, 3.5rem)" }}
      aria-hidden
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-[var(--wies-akcent,#166534)] via-emerald-500 to-amber-400/90 shadow-[0_0_12px_rgba(22,101,52,0.35)] transition-[width] duration-150 ease-out"
        style={{ width: `${postep * 100}%` }}
      />
    </div>
  );
}
