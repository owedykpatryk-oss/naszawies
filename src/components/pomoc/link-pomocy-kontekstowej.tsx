import Link from "next/link";

type Props = {
  href: string;
  label?: string;
  /** Krótki opis przy najechaniu */
  tytul?: string;
};

/** Ikona ? z linkiem do pomocy kontekstowej. */
export function LinkPomocyKontekstowej({ href, label = "Pomoc", tytul }: Props) {
  return (
    <Link
      href={href}
      title={tytul ?? label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sky-300/80 bg-sky-50 text-xs font-bold text-sky-900 transition hover:border-sky-500 hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      aria-label={label}
    >
      ?
    </Link>
  );
}
