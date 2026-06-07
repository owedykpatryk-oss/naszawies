/** Kanoniczny URL witryny (apex lub www — z env Vercel). */
export function pobierzBazeUrlWitryny(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "https://naszawies.pl";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `https://${raw.replace(/\/$/, "")}`;
}

export const NAZWA_WITRYNY = "naszawies.pl";
export const LOCALE_PL = "pl_PL";
