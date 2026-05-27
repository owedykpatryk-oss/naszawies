import Image from "next/image";
import type { ReactNode } from "react";
import { MARKA_SCIEZKI } from "@/lib/marka/sciezki";

type Props = {
  children: ReactNode;
  className?: string;
  /** Ukryj znak wodny (np. bardzo mały podgląd). */
  bezZnakuWodnego?: boolean;
};

/**
 * Otoczenie treści drukowanej / PDF: subtelny znak wodny na środku + logo w prawym górnym rogu.
 */
export function RamkaMarkiDokument({ children, className = "", bezZnakuWodnego = false }: Props) {
  return (
    <div className={`marka-doc-tresc relative isolate ${className}`}>
      {!bezZnakuWodnego ? (
        <div
          className="marka-doc-znak-wodny pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          aria-hidden
        >
          <Image
            src={MARKA_SCIEZKI.znakOkrag}
            alt=""
            width={280}
            height={280}
            className="h-auto max-h-[min(50%,280px)] w-auto max-w-[min(50%,280px)] opacity-[0.07] select-none"
            priority={false}
          />
        </div>
      ) : null}
      <div className="marka-doc-rog pointer-events-none absolute top-0 right-0 z-[2] h-11 w-11 sm:h-12 sm:w-12 print:h-14 print:w-14" aria-hidden>
        <Image
          src={MARKA_SCIEZKI.znakOkrag64}
          alt="naszawies.pl"
          width={56}
          height={56}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/** Nagłówek z pełnym logo + podpis serwisu (dokumenty świetlicy itp.). */
export function NaglowekMarkiDokumentu({
  tytul,
  podtytul,
}: {
  tytul: string;
  podtytul?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b-2 border-green-900/85 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <Image
          src={MARKA_SCIEZKI.logoPelne}
          alt="naszawies.pl"
          width={120}
          height={120}
          className="h-14 w-14 shrink-0 object-contain object-top sm:h-16 sm:w-16"
        />
        <div className="min-w-0">
          <p className="font-serif text-lg font-semibold tracking-tight text-green-950 sm:text-xl">naszawies.pl</p>
          <h1 className="mt-1 break-words font-serif text-xl font-normal leading-tight tracking-tight text-green-950 sm:text-2xl">
            {tytul}
          </h1>
          {podtytul ? <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">{podtytul}</p> : null}
        </div>
      </div>
    </header>
  );
}
