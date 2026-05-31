import type { User } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { maCiasteczkaSesjiSupabase } from "@/lib/auth/ciasteczka-sesji";
import { NAGLOWEK_USER_EMAIL, NAGLOWEK_USER_ID } from "@/lib/auth/naglowki-sesji-middleware";
import {
  sciezkaApiWymagaLogowania,
  sciezkaWymagaLogowania,
} from "@/lib/auth/sciezki-chronione";
import { dolaczNaglowkiBezpieczenstwa } from "@/lib/bezpieczenstwo/naglowki-odpowiedzi";
import { ipZRequestu, sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";

type CiasteczkaDoUstawienia = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

const METODY_DOZWOLONE = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

function odpowiedzZBazowymiNaglowkami(odpowiedz: NextResponse, sciezka: string): NextResponse {
  odpowiedz.headers.set("x-pathname", sciezka);
  return dolaczNaglowkiBezpieczenstwa(odpowiedz);
}

function dolaczCiasteczkaSesji(cel: NextResponse, ciasteczka: CiasteczkaDoUstawienia): void {
  ciasteczka.forEach(({ name, value, options }) => cel.cookies.set(name, value, options));
}

function dolaczNaglowkiUzytkownika(requestHeaders: Headers, user: User | null): void {
  requestHeaders.delete(NAGLOWEK_USER_ID);
  requestHeaders.delete(NAGLOWEK_USER_EMAIL);
  if (!user) return;
  requestHeaders.set(NAGLOWEK_USER_ID, user.id);
  if (user.email) requestHeaders.set(NAGLOWEK_USER_EMAIL, user.email);
}

function odpowiedzZNastepnym(
  request: NextRequest,
  ciasteczkaSesji: CiasteczkaDoUstawienia,
  user: User | null,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  dolaczNaglowkiUzytkownika(requestHeaders, user);
  const odpowiedz = NextResponse.next({
    request: { headers: requestHeaders },
  });
  dolaczCiasteczkaSesji(odpowiedz, ciasteczkaSesji);
  return odpowiedz;
}

function przekierujZachowujacSesje(
  request: NextRequest,
  ciasteczkaSesji: CiasteczkaDoUstawienia,
  pathname: string,
  search = "",
  user: User | null = null,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const przekierowanie = NextResponse.redirect(url);
  dolaczCiasteczkaSesji(przekierowanie, ciasteczkaSesji);
  if (user?.id) przekierowanie.headers.set(NAGLOWEK_USER_ID, user.id);
  if (user?.email) przekierowanie.headers.set(NAGLOWEK_USER_EMAIL, user.email);
  return odpowiedzZBazowymiNaglowkami(przekierowanie, pathname);
}

function wymagaWalidacjiUzytkownika(sciezka: string, wymagaKonta: boolean): boolean {
  return wymagaKonta || sciezka === "/" || sciezka.startsWith("/logowanie");
}

export async function middleware(request: NextRequest) {
  if (!METODY_DOZWOLONE.has(request.method)) {
    return odpowiedzZBazowymiNaglowkami(new NextResponse(null, { status: 405 }), request.nextUrl.pathname);
  }

  const sciezka = request.nextUrl.pathname;

  if (sciezka === "/favicon.ico") {
    return odpowiedzZBazowymiNaglowkami(
      NextResponse.rewrite(new URL("/icon", request.url)),
      sciezka,
    );
  }

  const ip = ipZRequestu(request.headers);

  if (sciezka.startsWith("/logowanie")) {
    const limit = await sprawdzLimitApi("logowanie", ip);
    if (!limit.ok) {
      return odpowiedzZBazowymiNaglowkami(
        new NextResponse("Zbyt wiele prób logowania. Spróbuj za chwilę.", { status: 429 }),
        sciezka,
      );
    }
  }

  if (sciezka.startsWith("/api/") && !sciezka.startsWith("/api/health")) {
    const apiGusGet =
      request.method === "GET" &&
      (sciezka.startsWith("/api/gus/") ||
        (sciezka.startsWith("/api/wies/") && sciezka.includes("/rolnictwo")));
    if (!apiGusGet) {
      const limit = await sprawdzLimitApi("api_publiczne", ip);
      if (!limit.ok) {
        return odpowiedzZBazowymiNaglowkami(
          NextResponse.json({ blad: "Zbyt wiele żądań. Odczekaj chwilę." }, { status: 429 }),
          sciezka,
        );
      }
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const wymagaKonta =
    sciezkaWymagaLogowania(sciezka) || sciezkaApiWymagaLogowania(sciezka);
  const maSesje = maCiasteczkaSesjiSupabase(request);
  const walidujUzytkownika = wymagaWalidacjiUzytkownika(sciezka, wymagaKonta);

  if (!url || !anonKey) {
    if (wymagaKonta) {
      if (sciezka.startsWith("/api/")) {
        return odpowiedzZBazowymiNaglowkami(
          NextResponse.json({ blad: "Serwis chwilowo niedostępny." }, { status: 503 }),
          sciezka,
        );
      }
      return przekierujZachowujacSesje(
        request,
        [],
        "/logowanie",
        `next=${encodeURIComponent(sciezka + request.nextUrl.search)}`,
      );
    }
    return odpowiedzZBazowymiNaglowkami(NextResponse.next({ request }), sciezka);
  }

  if (!maSesje && !walidujUzytkownika) {
    return odpowiedzZBazowymiNaglowkami(NextResponse.next({ request }), sciezka);
  }

  let ciasteczkaSesji: CiasteczkaDoUstawienia = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CiasteczkaDoUstawienia) {
        ciasteczkaSesji = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      },
    },
  });

  let user: User | null = null;

  if (walidujUzytkownika || maSesje) {
    // getSession odświeża wygasły access token z refresh tokena (httpOnly cookie).
    // getUser() na chronionych trasach potrafiło zwracać null mimo ważnej sesji → pętla logowania.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    user = session?.user ?? null;
  }

  if (sciezka === "/" && user) {
    return przekierujZachowujacSesje(request, ciasteczkaSesji, "/panel", "", user);
  }

  if (sciezka.startsWith("/logowanie") && user) {
    const nastepna = bezpiecznaSciezkaNastepna(request.nextUrl.searchParams.get("next") ?? undefined);
    return przekierujZachowujacSesje(request, ciasteczkaSesji, nastepna, "", user);
  }

  if (wymagaKonta && !user) {
    if (sciezka.startsWith("/api/")) {
      return odpowiedzZBazowymiNaglowkami(
        NextResponse.json({ blad: "Wymagane logowanie." }, { status: 401 }),
        sciezka,
      );
    }
    return przekierujZachowujacSesje(
      request,
      ciasteczkaSesji,
      "/logowanie",
      `next=${encodeURIComponent(sciezka + request.nextUrl.search)}`,
    );
  }

  return odpowiedzZBazowymiNaglowkami(odpowiedzZNastepnym(request, ciasteczkaSesji, user), sciezka);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?)$).*)",
  ],
};
