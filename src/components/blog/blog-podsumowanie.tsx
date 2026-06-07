type Props = {
  tekst: string;
};

/** Wyróżnione podsumowanie / lead artykułu nad treścią główną. */
export function BlogPodsumowanie({ tekst }: Props) {
  return (
    <div
      className="blog-callout blog-callout-porada mt-6"
      role="note"
      aria-label="Podsumowanie artykułu"
    >
      <strong>W skrócie</strong>
      <p className="mb-0 mt-2 text-base leading-relaxed">{tekst}</p>
    </div>
  );
}
