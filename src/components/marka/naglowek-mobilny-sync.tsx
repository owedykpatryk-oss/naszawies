"use client";

import { useEffect } from "react";

/** Ustawia wysokość sticky nagłówka — menu mobilne pozycjonuje się pod spodem. */
export function NaglowekMobilnySync() {
  useEffect(() => {
    function sync() {
      const header = document.getElementById("site-header");
      if (!header) return;
      document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    }
    sync();
    window.addEventListener("resize", sync);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    const header = document.getElementById("site-header");
    if (header && ro) ro.observe(header);
    return () => {
      window.removeEventListener("resize", sync);
      ro?.disconnect();
    };
  }, []);

  return null;
}
