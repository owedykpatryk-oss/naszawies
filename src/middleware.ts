import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sciezkaApiWymagaLogowania, sciezkaWymagaLogowania } from "@/lib/auth/sciezki-chronione";
import { dolaczNaglowkiBezpieczenstwa } from "@/lib/bezpieczenstwo/naglowki-odpowiedzi";
import { ipZRequestu, sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";

type CiasteczkaDoUstawienia = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

const METODY_DOZWOLONE = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

function odpowiedzZBazowymiNaglowkami(odpowiedz: NextResponse): NextResponse {
  return dolaczNaglowkiBezpieczenstwa(odpowiedz);
}

export async function middleware(request: NextRequest) {
  if (!METODY_DOZWOLONE.has(request.method)) {
    return odpowiedzZBazowymiNaglowkami(new NextResponse(null, { status: 405 }));
  }

  if (request.nextUrl.pathname === "/favicon.ico") {
    return odpowiedzZBazowymiNaglowkami(NextResponse.rewrite(new URL("/icon", request.url)));
  }

  const sciezka = request.nextUrl.pathname;
  const ip = ipZRequestu(request.headers);

  if (sciezka.startsWith("/logowanie")) {
    const limit = await sprawdzLimitApi("logowanie", ip);
    if (!limit.ok) {
      return odpowiedzZBazowymiNaglowkami(
        new NextResponse("Zbyt wiele prób logowania. Spróbuj za chwilę.", { status: 429 }),
      );
    }
  }

  if (sciezka.startsWith("/api/") && !sciezka.startsWith("/api/health")) {
    const limit = await sprawdzLimitApi("api_publiczne", ip);
    if (!limit.ok) {
      return odpowiedzZBazowymiNaglowkami(
        NextResponse.json({ blad: "Zbyt wiele żądań. Odczekaj chwilę." }, { status: 429 }),
      );
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const wymagaKontaBezSesji =
    sciezkaWymagaLogowania(sciezka) || sciezkaApiWymagaLogowania(sciezka);

  if (!url || !anonKey) {
    if (wymagaKontaBezSesji) {
      if (sciezka.startsWith("/api/")) {
        return odpowiedzZBazowymiNaglowkami(
          NextResponse.json({ blad: "Serwis chwilowo niedostępny." }, { status: 503 }),
        );
      }
      const przekierowanie = request.nextUrl.clone();
      przekierowanie.pathname = "/logowanie";
      przekierowanie.search = "";
      przekierowanie.searchParams.set("next", sciezka + request.nextUrl.search);
      return odpowiedzZBazowymiNaglowkami(NextResponse.redirect(przekierowanie));
    }
    return odpowiedzZBazowymiNaglowkami(NextResponse.next({ request }));
  }

  let odpowiedz = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CiasteczkaDoUstawienia) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        odpowiedz = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => odpowiedz.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wymagaKonta = sciezkaWymagaLogowania(sciezka) || sciezkaApiWymagaLogowania(sciezka);
  if (wymagaKonta && !user) {
    if (sciezka.startsWith("/api/")) {
      return odpowiedzZBazowymiNaglowkami(
        NextResponse.json({ blad: "Wymagane logowanie." }, { status: 401 }),
      );
    }
    const przekierowanie = request.nextUrl.clone();
    przekierowanie.pathname = "/logowanie";
    przekierowanie.search = "";
    przekierowanie.searchParams.set("next", sciezka + request.nextUrl.search);
    return odpowiedzZBazowymiNaglowkami(NextResponse.redirect(przekierowanie));
  }

  return odpowiedzZBazowymiNaglowkami(odpowiedz);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?)$).*)",
  ],
};
