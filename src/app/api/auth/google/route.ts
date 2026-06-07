import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { walidujTurnstileZNaglowkow } from "@/lib/turnstile/waliduj-token-serwer";

type CiasteczkaDoUstawienia = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

const tresc = z
  .object({
    cfTurnstileResponse: z.string().max(4096).optional(),
    nastepnaSciezka: z.string().max(500).optional(),
    pochodzeniePubliczne: z.string().max(500).optional(),
  })
  .strict();

/** Google OAuth — po walidacji Turnstile zwraca URL przekierowania (bez otwierania OAuth bez captcha). */
export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Niepoprawny format." }, { status: 400 });
  }

  const sparsowane = tresc.safeParse(json);
  if (!sparsowane.success) {
    return NextResponse.json({ error: "Niepoprawny format żądania." }, { status: 400 });
  }

  const d = sparsowane.data;

  const turnstile = await walidujTurnstileZNaglowkow(d.cfTurnstileResponse, request.headers);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.komunikat }, { status: 400 });
  }

  const ip = odczytajAdresIpZNaglowkow(request.headers);
  const limit = await sprawdzLimitApi("logowanie", ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zbyt wiele prób logowania z tego adresu. Spróbuj ponownie później." },
      { status: 429 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Serwis chwilowo niedostępny." }, { status: 503 });
  }

  const pochodzenie = (
    d.pochodzeniePubliczne?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://naszawies.pl"
  ).replace(/\/$/, "");
  const nastepna = bezpiecznaSciezkaNastepna(d.nastepnaSciezka);
  const nastepnyZakodowany = encodeURIComponent(nastepna);

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CiasteczkaDoUstawienia) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${pochodzenie}/auth/potwierdz?next=${nastepnyZakodowany}`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    const nieWlaczony = error?.message && /not enabled|unsupported provider/i.test(error.message);
    return NextResponse.json(
      {
        error: nieWlaczony
          ? "Logowanie przez Google nie jest jeszcze skonfigurowane. Skontaktuj się z administratorem."
          : error?.message || "Nie udało się rozpocząć logowania przez Google.",
      },
      { status: 400 },
    );
  }

  const odpowiedz = NextResponse.json({ url: data.url });
  response.cookies.getAll().forEach(({ name, value }) => {
    odpowiedz.cookies.set(name, value);
  });
  return odpowiedz;
}
