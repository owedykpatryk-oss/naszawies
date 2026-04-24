import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type CiasteczkaDoUstawienia = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

function bezpiecznaSciezkaPrzekierowania(wartosc: string | null): string {
  if (!wartosc) return "/panel";
  let s: string;
  try {
    s = decodeURIComponent(wartosc);
  } catch {
    return "/panel";
  }
  if (!s.startsWith("/") || s.startsWith("//")) return "/panel";
  return s;
}

/** Wymiana `?code=` (e-mail PKCE lub OAuth) na sesję w ciasteczkach. */
export async function GET(request: Request) {
  const adres = new URL(request.url);
  const bladOAuth = adres.searchParams.get("error");
  const opisBleduOAuth = adres.searchParams.get("error_description");
  const kod = adres.searchParams.get("code");
  const nastepny = bezpiecznaSciezkaPrzekierowania(adres.searchParams.get("next"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/logowanie?blad=konfiguracja", adres.origin));
  }

  if (bladOAuth) {
    const surowy = (opisBleduOAuth ?? bladOAuth).replace(/\+/g, " ");
    let skrot = surowy;
    try {
      skrot = decodeURIComponent(surowy);
    } catch {
      skrot = surowy;
    }
    skrot = skrot.slice(0, 200);
    const zwr = new URL("/logowanie", adres.origin);
    zwr.searchParams.set("blad", "sesja-zewnetrzna");
    if (skrot) zwr.searchParams.set("szczegol", skrot);
    return NextResponse.redirect(zwr);
  }

  if (kod) {
    const cookieStore = cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CiasteczkaDoUstawienia) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(kod);
    if (!error) {
      return NextResponse.redirect(new URL(nastepny, adres.origin));
    }
  }

  return NextResponse.redirect(new URL("/logowanie?blad=sesja-zewnetrzna", adres.origin));
}
