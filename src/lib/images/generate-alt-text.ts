/** Prosty alt po polsku — bez tekstu w obrazie (WCAG + SEO). */
export function generateAltText(tytulArtykulu: string, kontekst?: string): string {
  const baza = tytulArtykulu.trim();
  if (kontekst?.trim()) {
    return `${baza} — ${kontekst.trim()}`.slice(0, 200);
  }
  return `Ilustracja do artykułu: ${baza}`.slice(0, 200);
}
