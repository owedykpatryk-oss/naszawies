"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Placeholder gdy element jeszcze poza viewportem */
  placeholder?: ReactNode;
  /** Margines wokół root (px) — wcześniejsze ładowanie przed wejściem w kadr */
  rootMargin?: string;
  className?: string;
};

export function LazyWidoczny({
  children,
  placeholder = null,
  rootMargin = "200px 0px",
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [widoczny, ustawWidoczny] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || widoczny) return;

    if (typeof IntersectionObserver === "undefined") {
      ustawWidoczny(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          ustawWidoczny(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, widoczny]);

  return (
    <div ref={ref} className={className}>
      {widoczny ? children : placeholder}
    </div>
  );
}
