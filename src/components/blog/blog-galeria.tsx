import Image from "next/image";
import { generateAltText } from "@/lib/images/generate-alt-text";

type Props = {
  zdjecia: string[];
  tytulArtykulu: string;
};

export function BlogGaleria({ zdjecia, tytulArtykulu }: Props) {
  const unikalne = Array.from(new Set(zdjecia.filter(Boolean)));
  if (unikalne.length <= 1) return null;

  return (
    <section className="mt-10" aria-labelledby="blog-galeria-tytul">
      <h2 id="blog-galeria-tytul" className="font-serif text-xl text-green-950 dark:text-green-50">
        Galeria
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {unikalne.map((src, i) => (
          <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200/80 dark:border-stone-700">
            <Image
              src={src}
              alt={generateAltText(tytulArtykulu, `zdjęcie ${i + 1}`)}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 320px"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
