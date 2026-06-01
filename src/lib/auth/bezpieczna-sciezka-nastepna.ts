/** Dozwolone tylko ścieżki względne w obrębie witryny (ochrona przed open redirect). */
export function bezpiecznaSciezkaNastepna(raw?: string): string {
  if (!raw) return "/mapa";

  let sciezka: string;
  try {
    sciezka = decodeURIComponent(raw.trim());
  } catch {
    return "/mapa";
  }

  if (!sciezka.startsWith("/") || sciezka.startsWith("//") || sciezka.includes("\\")) {
    return "/mapa";
  }

  if (sciezka.includes(":")) {
    return "/mapa";
  }

  if (sciezka.includes("\0") || sciezka.includes("\r") || sciezka.includes("\n")) {
    return "/mapa";
  }

  return sciezka;
}
