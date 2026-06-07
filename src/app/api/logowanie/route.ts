import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { czyProfilMaAktualnaAkceptacjePrawna } from "@/lib/rodo/czy-ma-akceptacje-prawna";
import { sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { walidujTurnstileZNaglowkow } from "@/lib/turnstile/waliduj-token-serwer";

type CiasteczkaDoUstawienia = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

const tresc = z
  .object({
    email: z.string().email().max(320),
    haslo: z.string().min(6).max(128),
    nastepnaSciezka: z.string().max(500).optional(),
    cfTurnstileResponse: z.string().max(4096).optional(),
  })
  .strict();

function mapujBladLogowania(msg: string): string {
  if (msg === "Invalid login credentials") return "Nieprawidłowy e-mail lub hasło.";
  if (msg === "Email not confirmed") return "Najpierw potwierdź adres e-mail (sprawdź skrzynkę).";
  if (msg.toLowerCase().includes("too many requests")) {
    return "Za dużo prób logowania. Odczekaj chwilę i spróbuj ponownie.";
  }
  if (/captcha|timeout-or-duplicate/i.test(msg)) {
    return "Weryfikacja antyspamowa wygasła. Odśwież stronę i spróbuj ponownie.";
  }
  return msg;
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Niepoprawny format." }, { status: 400 });
  }

  const sparsowane = tresc.safeParse(json);
  if (!sparsowane.success) {
    const msg = sparsowane.error.issues[0]?.message || "Sprawdź pola formularza.";
    return NextResponse.json({ error: msg }, { status: 400 });
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

  const cel = bezpiecznaSciezkaNastepna(d.nastepnaSciezka);
  let response = NextResponse.json({ ok: true, redirect: cel });

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

  const email = d.email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: d.haslo,
  });

  if (error) {
    return NextResponse.json({ error: mapujBladLogowania(error.message) }, { status: 400 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (userId) {
    const { data: profil } = await supabase
      .from("users")
      .select("legal_accepted_at, legal_bundle_version")
      .eq("id", userId)
      .maybeSingle();
    if (!czyProfilMaAktualnaAkceptacjePrawna(profil)) {
      const akceptacja = `/panel/akceptacja-regulaminu?next=${encodeURIComponent(cel)}`;
      response = NextResponse.json({ ok: true, redirect: akceptacja });
    }
  }

  return response;
}
