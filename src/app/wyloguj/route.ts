import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type CiasteczkaDoUstawienia = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

async function wylogujSesje() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;

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
  await supabase.auth.signOut();
}

function przekierujNaStroneGlowna(request: Request) {
  const adres = new URL(request.url);
  return NextResponse.redirect(new URL("/", adres.origin), { status: 303 });
}

/** Formularz POST z panelu (zalecane). */
export async function POST(request: Request) {
  await wylogujSesje();
  return przekierujNaStroneGlowna(request);
}

/** Link „Wyloguj” (GET) — wygodniejsze; w produkcji można ograniczyć tylko do POST. */
export async function GET(request: Request) {
  await wylogujSesje();
  return przekierujNaStroneGlowna(request);
}
