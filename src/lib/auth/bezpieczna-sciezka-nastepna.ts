/** Dozwolone tylko ścieżki względne w obrębie witryny (ochrona przed open redirect). */
export function bezpiecznaSciezkaNastepna(n?: string): string {
  if (!n || !n.startsWith("/") || n.startsWith("//")) return "/panel";
  return n;
}
