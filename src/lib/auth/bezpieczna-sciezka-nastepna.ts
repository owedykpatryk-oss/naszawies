/** Dozwolone tylko ścieżki względne w obrębie witryny (ochrona przed open redirect). */
export function bezpiecznaSciezkaNastepna(raw?: string): string {
  if (!raw) return "/panel";

  let sciezka: string;
  try {
    sciezka = decodeURIComponent(raw.trim());
  } catch {
    return "/panel";
  }

  if (!sciezka.startsWith("/") || sciezka.startsWith("//") || sciezka.includes("\\")) {
    return "/panel";
  }

  if (sciezka.includes(":")) {
    return "/panel";
  }

  if (sciezka.includes("\0") || sciezka.includes("\r") || sciezka.includes("\n")) {
    return "/panel";
  }

  return sciezka;
}
