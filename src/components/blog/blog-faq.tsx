import type { BlogFaq } from "@/lib/blog/typy";

type Props = {
  pozycje: BlogFaq[];
};

export function BlogFaq({ pozycje }: Props) {
  if (!pozycje.length) return null;

  return (
    <section className="mt-10" aria-labelledby="blog-faq-tytul">
      <h2 id="blog-faq-tytul" className="font-serif text-xl text-green-950 dark:text-green-50">
        Najczęstsze pytania
      </h2>
      <div className="mt-4 space-y-3">
        {pozycje.map((p) => (
          <details
            key={p.question}
            className="group rounded-xl border border-stone-200/80 bg-white/90 p-4 dark:border-stone-700 dark:bg-stone-900/40"
          >
            <summary className="cursor-pointer list-none font-medium text-stone-900 marker:content-none dark:text-stone-100">
              <span className="flex items-start justify-between gap-2">
                {p.question}
                <span className="text-stone-400 transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{p.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
