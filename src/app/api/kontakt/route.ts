import { NextResponse } from "next/server";
import { z } from "zod";
import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";
import { htmlSzablonNaszawies, siteUrlDlaSzablonuEmail } from "@/lib/email/szablon-html-naszawies";
import { wyslijPrzezResend } from "@/lib/email/wyslij-przez-resend";
import { sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { escapeHtml } from "@/lib/tekst/escape-html";
import { walidujOdpowiedzTurnstile } from "@/lib/turnstile/waliduj-token-serwer";

const tresc = z
  .object({
    imie: z.string().min(2).max(120),
    email: z.string().email(),
    temat: z.string().min(3).max(200),
    wiadomosc: z.string().min(10).max(8000),
    rodoZaakceptowane: z.boolean().refine((v) => v === true),
    cfTurnstileResponse: z.string().max(4096).optional(),
    bottrap: z.string().optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.bottrap && d.bottrap.trim() !== "") {
      ctx.addIssue({
        code: "custom",
        message: "Odrzucono.",
        path: ["bottrap"],
      });
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
    const msg =
      sparsowane.error.issues[0]?.message || "Sprawdź pola formularza.";
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
  const limit = await sprawdzLimitApi("kontakt", ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zbyt wiele wiadomości z tego adresu. Spróbuj ponownie później." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryPoSekundach) },
      },
    );
  }

  const docelowy =
    process.env.KONTAKT_EMAIL_DOCELOWY || "kontakt@naszawies.pl";

  const trescWewnetrzna = `
    <p><strong>Imię:</strong> ${escapeHtml(d.imie)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(d.email)}</p>
    <p><strong>Temat:</strong> ${escapeHtml(d.temat)}</p>
    <hr style="border:none;border-top:1px solid #ddd;margin:16px 0"/>
    <pre style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:0">${escapeHtml(d.wiadomosc)}</pre>
  `;
  const html = htmlSzablonNaszawies({
    siteUrl: siteUrlDlaSzablonuEmail(),
    naglowek: "Wiadomość z formularza kontaktowego",
    trescHtml: trescWewnetrzna,
  });

  const wynik = await wyslijPrzezResend({
    do: docelowy,
    temat: `[naszawies.pl] ${d.temat}`,
    trescHtml: html,
    odpowiedzDo: d.email,
  });

  if (!wynik.ok) {
    console.error("[kontakt]", wynik.blad);
    return NextResponse.json(
      {
        error:
          "Nie udało się wysłać wiadomości. Spróbuj później lub napisz bezpośrednio na kontakt@naszawies.pl.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
