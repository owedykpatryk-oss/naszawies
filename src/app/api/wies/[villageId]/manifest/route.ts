import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { pobierzUstawieniaWsi } from "@/lib/wies/pobierz-ustawienia-wsi";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { MARKA_SCIEZKI } from "@/lib/marka/sciezki";

type Params = { params: { villageId: string } };

/** Manifest PWA dopasowany do profilu wsi (kolor, nazwa, start URL). */
export async function GET(_req: Request, { params }: Params) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Brak połączenia z bazą." }, { status: 503 });
  }
  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, slug, voivodeship, county, commune")
    .eq("id", params.villageId)
    .maybeSingle();

  if (!wies) {
    return NextResponse.json({ blad: "Nie znaleziono wsi." }, { status: 404 });
  }

  const ustawienia = await pobierzUstawieniaWsi(supabase, wies.id);
  const startUrl = sciezkaProfiluWsi(wies);
  const nazwa = wies.name.length > 32 ? `${wies.name.slice(0, 29)}…` : wies.name;

  const manifest = {
    id: startUrl,
    name: `${wies.name} — naszawies.pl`,
    short_name: nazwa,
    description: `Profil wsi ${wies.name} na naszawies.pl — ogłoszenia, mapa, świetlica i społeczność.`,
    start_url: startUrl,
    scope: startUrl,
    display: "standalone" as const,
    orientation: "portrait-primary" as const,
    background_color: ustawienia.motyw.tlo,
    theme_color: ustawienia.motyw.akcent,
    lang: "pl",
    dir: "ltr" as const,
    icons: [
      {
        src: ustawienia.logo_url || MARKA_SCIEZKI.emblem192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any" as const,
      },
      {
        src: ustawienia.logo_url || MARKA_SCIEZKI.emblem512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any" as const,
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
