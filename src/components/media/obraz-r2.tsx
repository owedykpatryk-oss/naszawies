import { zbudujSrcSetObrazuR2, zbudujUrlObrazuR2, type PresetObrazuR2 } from "@/lib/cloudflare/r2-obraz";

type Props = {
  src?: string | null;
  alt?: string;
  preset?: PresetObrazuR2;
  className?: string;
  /** Lazy load domyślnie włączone. */
  lazy?: boolean;
  /** srcSet retina gdy CDN włączony. */
  retina?: boolean;
};

/**
 * Obraz z R2 z opcjonalną optymalizacją Cloudflare CDN (`NEXT_PUBLIC_R2_CDN_IMAGES=1`).
 * Dla URL spoza R2 renderuje zwykły `<img>`.
 */
export function ObrazR2({
  src,
  alt = "",
  preset = "karta",
  className = "",
  lazy = true,
  retina = true,
}: Props) {
  const href = zbudujUrlObrazuR2(src, preset) ?? src ?? undefined;
  if (!href) return null;

  const srcSet = retina ? zbudujSrcSetObrazuR2(src, preset) : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={href}
      srcSet={srcSet}
      alt={alt}
      className={className}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
    />
  );
}
