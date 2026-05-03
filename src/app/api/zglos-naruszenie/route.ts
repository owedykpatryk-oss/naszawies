import { NextResponse } from "next/server";
import { z } from "zod";
import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";
import { wyslijPrzezResend } from "@/lib/email/wyslij-przez-resend";
import { sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { escapeHtml } from "@/lib/tekst/escape-html";
import { walidujOdpowiedzTurnstile } from "@/lib/turnstile/waliduj-token-serwer";

const tresc = z
  .object({
    imie: z.string().min(2).max(120),
    email: z.string().email(),
    urlStrony: z.string().url().max(2048),
    opis: z.string().min(20).max(8000),
    rodoZaakceptowane: z.boolean().refine((v) => v === true),
    cfTurnstileResponse: z.string().max(4096).optional(),
    bottrap: z.string().optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.bottrap && d.bottrap.trim() !== "") {
      ctx.addIssue({ code: "custom", message: "Odrzucono.", path: ["bottrap"] });
    }
  });

export async function POST(request: Request) {
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

  const turnstile = await walidujOdpowiedzTurnstile(d.cfTurnstileResponse);
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Weryfikacja antybotowa nie powiodła się. Odśwież stronę i spróbuj ponownie." },
      { status: 400 },
    );
  }

  const ip = odczytajAdresIpZNaglowkow(request.headers);
  const limit = await sprawdzLimitApi("zglos_naruszenie", ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zbyt wiele zgłoszeń z tego adresu. Spróbuj ponownie później." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryPoSekundach) },
      },
    );
  }

  const docelowy =
    process.env.ZGLOSZENIA_NARUSZENIA_EMAIL ||
    process.env.KONTAKT_EMAIL_DOCELOWY ||
    "moderacja@naszawies.pl";

  const html = `
    <p><strong>Zgłoszenie naruszenia (DSA / moderacja)</strong></p>
    <p><strong>Imię:</strong> ${escapeHtml(d.imie)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(d.email)}</p>
    <p><strong>Adres strony (URL):</strong> <a href="${escapeHtml(d.urlStrony)}">${escapeHtml(d.urlStrony)}</a></p>
    <hr/>
    <p><strong>Opis zgłoszenia:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(d.opis)}</pre>
  `;

  const wynik = await wyslijPrzezResend({
    do: docelowy,
    temat: `[naszawies.pl] Zgłoszenie naruszenia — ${d.urlStrony.slice(0, 80)}`,
    trescHtml: html,
    odpowiedzDo: d.email,
  });

  if (!wynik.ok) {
    console.error("[zglos-naruszenie]", wynik.blad);
    return NextResponse.json(
      {
        error:
          "Nie udało się wysłać zgłoszenia. Spróbuj później lub napisz na moderacja@naszawies.pl.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
