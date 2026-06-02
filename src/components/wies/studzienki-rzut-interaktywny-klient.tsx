"use client";

import Image from "next/image";

const OBRAZ = "/wies/studzienki/rzut-parteru.png";

/** Statyczny rzut parteru z dokumentacji projektowej (bez warstwy interaktywnej). */
export function StudzienkiRzutInteraktywny() {
  return (
    <div className="relative max-w-5xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.15)] sm:rounded-3xl">
      <Image
        src={OBRAZ}
        alt="Rzut parteru projektowanej świetlicy wiejskiej w Studzienkach — dokumentacja architektoniczna"
        width={1600}
        height={1200}
        className="h-auto w-full"
        priority
        sizes="(max-width: 1024px) 100vw, min(896px, 70vw)"
      />
    </div>
  );
}
