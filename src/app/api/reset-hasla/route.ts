import { NextResponse } from "next/server";
import { z } from "zod";
import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";
import { siteUrlDlaSzablonuEmail } from "@/lib/email/szablon-html-naszawies";
import { sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { walidujOdpowiedzTurnstile } from "@/lib/turnstile/waliduj-token-serwer";

const tresc = z
  .object({
    email: z.string().email().max(320),
    cfTurnstileResponse: z.string().max(4096).optional(),
  })
  .strict();

function mapujBladReset(msg: string): string {
  if (msg.toLowerCase().includes("too many requests")) {
    return "Za dużo prób. Odczekaj chwilę i spróbuj ponownie.";
  }
  if (/captcha|timeout-or-duplicate/i.test(msg)) {
    return "Weryfikacja antyspamowa wygasła. Odśwież stronę i spróbuj ponownie.";
  }
  return msg;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Niepoprawny format." }, { status: 400 });
  }

  const sparsowane = tresc.safeParse(json);
  if (!sparsowane.success) {
    const msg = sparsowane.error.issues[0]?.message || "Sprawdź pole e-mail.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const d = sparsowane.data;

  const turnstile = await walidujOdpowiedzTurnstile(d.cfTurnstileResponse);
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Weryfikacja antybotowa nie powiodła się. Odśwież stronę i spróbuj ponownie." },
      { status: 400 },
    );
  }

  const ip = odczytajAdresIpZNaglowkow(request.headers);
  const limit = await sprawdzLimitApi("logowanie", ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zbyt wiele prób z tego adresu. Spróbuj ponownie później." },
      { status: 429 },
    );
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Serwis chwilowo niedostępny." }, { status: 503 });
  }

  const email = d.email.trim().toLowerCase();
  const pochodzenie = siteUrlDlaSzablonuEmail();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${pochodzenie}/auth/potwierdz?next=${encodeURIComponent("/auth/ustaw-haslo")}`,
  });

  if (error) {
    return NextResponse.json({ error: mapujBladReset(error.message) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
