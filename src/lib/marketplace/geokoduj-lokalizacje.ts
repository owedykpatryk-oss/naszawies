/** Proste geokodowanie Nominatim (OSM) — tylko po stronie serwera, z ograniczeniem zapytań. */
export async function geokodujLokalizacjeTekst(
  locationText: string,
  kontekstWsi?: string | null,
): Promise<{ latitude: number; longitude: number } | null> {
  const fragment = locationText.trim();
  if (fragment.length < 3) return null;

  const kontekst = kontekstWsi?.trim() ?? "";
  const wariantyZapytan = [
    [fragment, kontekst, "Polska"].filter(Boolean).join(", "),
    kontekst ? `${fragment}, ${kontekst.split(",")[0]?.trim()}, Polska` : null,
    `${fragment}, Polska`,
  ].filter((q): q is string => Boolean(q?.trim()));

  for (const zapytanie of wariantyZapytan) {
    const wynik = await geokodujJednoZapytanie(zapytanie);
    if (wynik) return wynik;
    await new Promise((r) => setTimeout(r, 1100));
  }
  return null;
}

async function geokodujJednoZapytanie(zapytanie: string): Promise<{ latitude: number; longitude: number } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", zapytanie);

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Naszawies.pl/1.0 (local marketplace geocoding)" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const pierwszy = data[0];
    if (!pierwszy?.lat || !pierwszy?.lon) return null;
    const latitude = Number.parseFloat(pierwszy.lat);
    const longitude = Number.parseFloat(pierwszy.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}
