import { NextResponse } from "next/server";

/** Kompatybilność wsteczna — przekierowanie na statyczne pliki marki. */
export async function GET(
  request: Request,
  { params }: { params: { rozmiar: string } },
) {
  const n = Number.parseInt(params.rozmiar, 10);
  const rozmiar = Number.isFinite(n) ? Math.min(512, Math.max(64, n)) : 192;
  const plik =
    rozmiar >= 400 ? "/marka/znak-okrag-512.png" : rozmiar >= 128 ? "/marka/znak-okrag-192.png" : "/marka/znak-okrag-64.png";
  return NextResponse.redirect(new URL(plik, request.url), 308);
}
