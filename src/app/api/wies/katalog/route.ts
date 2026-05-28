import { NextResponse } from "next/server";
import { z } from "zod";
import { wymagajLogowaniaApi } from "@/lib/auth/wymagaj-logowania-api";
import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";
import { sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import {
  pobierzGminyKatalog,
  pobierzPowiatyKatalog,
  pobierzWojewodztwaKatalog,
  pobierzWsiKatalog,
} from "@/lib/wies/katalog-administracyjny";
import { slugCzesciZBazy } from "@/lib/wies/slug-administracyjny";

const zapytanie = z.discriminatedUnion("poziom", [
  z.object({ poziom: z.literal("wojewodztwa") }),
  z.object({
    poziom: z.literal("powiaty"),
    woj: z.string().trim().min(1).max(80),
  }),
  z.object({
    poziom: z.literal("gminy"),
    woj: z.string().trim().min(1).max(80),
    pow: z.string().trim().min(1).max(80),
  }),
  z.object({
    poziom: z.literal("wsi"),
    woj: z.string().trim().min(1).max(80),
    pow: z.string().trim().min(1).max(80),
    gmina: z.string().trim().min(1).max(80),
  }),
]);

export async function GET(request: Request) {
  const auth = await wymagajLogowaniaApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const poziom = searchParams.get("poziom") ?? "";
  const sparsowane = zapytanie.safeParse({
    poziom,
    woj: searchParams.get("woj") ?? undefined,
    pow: searchParams.get("pow") ?? undefined,
    gmina: searchParams.get("gmina") ?? undefined,
  });
  if (!sparsowane.success) {
    const msg = sparsowane.error.issues[0]?.message ?? "Niepoprawne parametry katalogu.";
    return NextResponse.json({ blad: msg }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Katalog jest chwilowo niedostępny. Spróbuj za chwilę." }, { status: 503 });
  }

  const ip = odczytajAdresIpZNaglowkow(request.headers);
  const limit = await sprawdzLimitApi("szukaj_wies", ip);
  if (!limit.ok) {
    return NextResponse.json(
      { blad: "Zbyt wiele zapytań. Odczekaj chwilę i spróbuj ponownie." },
      { status: 429, headers: { "Retry-After": String(limit.retryPoSekundach) } },
    );
  }

  const p = sparsowane.data;
  let elementy: Awaited<ReturnType<typeof pobierzWojewodztwaKatalog>> = [];
  let wsi: Awaited<ReturnType<typeof pobierzWsiKatalog>> | undefined;

  if (p.poziom === "wojewodztwa") {
    elementy = await pobierzWojewodztwaKatalog(supabase);
  } else if (p.poziom === "powiaty") {
    elementy = await pobierzPowiatyKatalog(supabase, slugCzesciZBazy(p.woj));
  } else if (p.poziom === "gminy") {
    elementy = await pobierzGminyKatalog(supabase, slugCzesciZBazy(p.woj), slugCzesciZBazy(p.pow));
  } else {
    const woj = slugCzesciZBazy(p.woj);
    const pow = slugCzesciZBazy(p.pow);
    const gmina = slugCzesciZBazy(p.gmina);
    wsi = await pobierzWsiKatalog(supabase, woj, pow, gmina);
    if (wsi.length === 0) {
      return NextResponse.json(
        { blad: "Nie znaleziono miejscowości w tej gminie. Sprawdź wybór lub użyj wyszukiwania po nazwie." },
        { status: 404 },
      );
    }
  }

  if (p.poziom !== "wsi" && elementy.length === 0) {
    return NextResponse.json({ blad: "Brak danych dla wybranego poziomu." }, { status: 404 });
  }

  const naglowki =
    p.poziom === "wojewodztwa"
      ? { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" }
      : { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" };

  return NextResponse.json(
    p.poziom === "wsi" ? { wsi } : { elementy },
    { headers: naglowki },
  );
}
