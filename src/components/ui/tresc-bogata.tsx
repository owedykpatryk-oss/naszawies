import { przetworzTrescBogata } from "@/lib/tresc/tresc-bogata";

type Props = {
  tresc: string;
  className?: string;
};

export function WyswietlTrescBogata({ tresc, className = "" }: Props) {
  const html = przetworzTrescBogata(tresc);
  if (!html) return null;

  return (
    <div
      className={`tresc-bogata text-sm leading-relaxed text-stone-700 sm:text-[0.95rem] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
