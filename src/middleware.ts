import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CiasteczkaDoUstawienia = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/favicon.ico") {
    return NextResponse.rewrite(new URL("/icon", request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  /** Przekazywanie `request` + ponowne tworzenie odpowiedzi przy `setAll` — wymagane do zapisu odświeżonej sesji Supabase (PKCE / OAuth). */
  let odpowiedz = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CiasteczkaDoUstawienia) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        odpowiedz = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          odpowiedz.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sciezka = request.nextUrl.pathname;
  if (sciezka.startsWith("/panel") && !user) {
    const przekierowanie = request.nextUrl.clone();
    przekierowanie.pathname = "/logowanie";
    przekierowanie.searchParams.set("next", sciezka + request.nextUrl.search);
    return NextResponse.redirect(przekierowanie);
  }

  return odpowiedz;
}

export const config = {
  matcher: [
    /* favicon.ico: bez wykluczenia — rewrite na /icon zamiast domyślnej ikony Next/Vercel */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?)$).*)",
  ],
};
