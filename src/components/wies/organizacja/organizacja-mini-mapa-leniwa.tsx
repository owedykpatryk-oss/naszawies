"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  wysokosc?: number;
  etykieta?: string;
};

/** Ładuje mini-mapę Leaflet dopiero po wejściu w viewport (mniej JS na starcie). */
export function OrganizacjaMiniMapaLeniwa({
  children,
  wysokosc = 168,
  etykieta = "Ładowanie podglądu mapy…",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [gotowa, ustawGotowa] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || gotowa) return;

    if (typeof IntersectionObserver === "undefined") {
      ustawGotowa(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([wpis]) => {
        if (wpis?.isIntersecting) {
          ustawGotowa(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [gotowa]);

  return (
    <div ref={ref} className="min-w-0">
      {gotowa ? (
        children
      ) : (
        <div
          className="organizacja-hero-mapa-szkielet overflow-hidden rounded-xl border border-stone-200/80 bg-stone-100/90 shadow-md"
          style={{ height: wysokosc }}
          role="status"
          aria-label={etykieta}
        >
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="text-lg opacity-40" aria-hidden>
              🗺
            </span>
            <span className="text-[11px] font-medium text-stone-500">{etykieta}</span>
          </div>
        </div>
      )}
    </div>
  );
}
