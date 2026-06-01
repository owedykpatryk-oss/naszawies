"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Opóźnienie animacji w ms (kolejne kafelki). */
  opoznienieMs?: number;
  as?: "div" | "section" | "article" | "li";
};

/** Płynne wejście elementu po wejściu w viewport (szanuje prefers-reduced-motion). */
export function UjawnijPoPrzewinieciu({
  children,
  className = "",
  opoznienieMs = 0,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("ujawnij-scroll--widoczny");
      return;
    }
    const obs = new IntersectionObserver(
      ([wpis]) => {
        if (wpis?.isIntersecting) {
          el.classList.add("ujawnij-scroll--widoczny");
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`ujawnij-scroll ${className}`.trim()}
      style={opoznienieMs > 0 ? { transitionDelay: `${opoznienieMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
