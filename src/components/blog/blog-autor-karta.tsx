import Image from "next/image";
import type { BlogAutor } from "@/lib/blog/typy";

type Props = {
  autor: BlogAutor;
};

export function BlogAutorKarta({ autor }: Props) {
  return (
    <section className="mt-10 flex gap-4 rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 dark:border-stone-700 dark:bg-stone-900/30">
      {autor.avatar ? (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-stone-800">
          <Image src={autor.avatar} alt="" fill className="object-cover" sizes="56px" />
        </div>
      ) : null}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Autor</p>
        <p className="font-medium text-green-950 dark:text-green-50">{autor.name}</p>
        {autor.bio ? <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{autor.bio}</p> : null}
      </div>
    </section>
  );
}
