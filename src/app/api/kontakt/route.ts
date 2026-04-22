import { NextResponse } from "next/server";
import { z } from "zod";
import { wyslijPrzezResend } from "@/lib/email/wyslij-przez-resend";
import { escapeHtml } from "@/lib/tekst/escape-html";

const tresc = z
  .object({
    imie: z.string().min(2).max(120),
    email: z.string().email(),
    temat: z.string().min(3).max(200),
    wiadomosc: z.string().min(10).max(8000),
    rodoZaakceptowane: z.boolean().refine((v) => v === true),
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
  const docelowy =
    process.env.KONTAKT_EMAIL_DOCELOWY || "kontakt@naszawies.pl";

  const html = `
    <p><strong>Imię:</strong> ${escapeHtml(d.imie)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(d.email)}</p>
    <p><strong>Temat:</strong> ${escapeHtml(d.temat)}</p>
    <hr/>
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(d.wiadomosc)}</pre>
  `;

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
