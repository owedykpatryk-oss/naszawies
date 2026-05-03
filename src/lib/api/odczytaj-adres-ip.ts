/** Pierwszy adres z łańcucha proxy (Vercel / CDN). */
export function odczytajAdresIpZNaglowkow(naglowki: Headers): string {
  const xff = naglowki.get("x-forwarded-for");
  if (xff) {
    const pierwszy = xff.split(",")[0]?.trim();
    if (pierwszy) return pierwszy;
  }
  const realIp = naglowki.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "anonim";
}
