"use client";

import { useEffect } from "react";

/** Uruchamia obserwator .ujawnij-scroll na stronach bez landing-app.js (profil wsi itd.). */
export function InicjalizujUjawnijScrollKlient() {
  useEffect(() => {
    const els = document.querySelectorAll(".ujawnij-scroll:not(.ujawnij-scroll--widoczny)");
    if (els.length === 0) return;

    const pokaz = (el: Element) => {
      el.classList.add("ujawnij-scroll--widoczny");
    };

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      els.forEach(pokaz);
      return;
    }

    const obs = new IntersectionObserver(
      (wpisy) => {
        for (const w of wpisy) {
          if (w.isIntersecting) {
            pokaz(w.target);
            obs.unobserve(w.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return null;
}
