import { generujIkoneMarki } from "@/lib/pwa/generuj-ikone-marki";

/** Dynamiczna ikona PWA / powiadomień push — generowana z grafiki marki. */
export async function GET(
  _request: Request,
  { params }: { params: { rozmiar: string } },
) {
  const n = Number.parseInt(params.rozmiar, 10);
  const rozmiar = Number.isFinite(n) ? Math.min(512, Math.max(32, n)) : 192;
  return generujIkoneMarki(rozmiar);
}
