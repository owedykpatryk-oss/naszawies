import { NextResponse } from "next/server";
import { z } from "zod";
import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";
import { htmlSzablonNaszawies, siteUrlDlaSzablonuEmail } from "@/lib/email/szablon-html-naszawies";
import { wyslijPrzezResend } from "@/lib/email/wyslij-przez-resend";
import { KATEGORIE_ZGLOSZENIA_STRONY } from "@/lib/pomoc/przewodniki";
import { sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { escapeHtml } from "@/lib/tekst/escape-html";
import { walidujTurnstileZNaglowkow } from "@/lib/turnstile/waliduj-token-serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const schema = z
  .object({
    category: z.enum(["blad_strony", "logowanie", "panel", "mapa", "platnosci", "pomysl", "inny"]),
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(8000),
    pageUrl: z.string().max(2048).optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    cfTurnstileResponse: z.string().max(4096).optional(),
    bottrap: z.string().optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.bottrap?.trim()) {
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

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Sprawdź pola." }, { status: 400 });
  }

  const ip = odczytajAdresIpZNaglowkow(request.headers);
  const limit = await sprawdzLimitApi("kontakt", ip);
  if (!limit.ok) {
    return NextResponse.json({ error: "Zbyt wiele zgłoszeń. Spróbuj później." }, { status: 429 });
  }

  const d = parsed.data;

  const turnstile = await walidujTurnstileZNaglowkow(d.cfTurnstileResponse, request.headers);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.komunikat }, { status: 400 });
  }

  const user = await pobierzUzytkownikaDoAkcji();

  const admin = createAdminSupabaseClient();
  if (admin) {
    const { error } = await admin.from("site_feedback_reports").insert({
      user_id: user?.id ?? null,
      category: d.category,
      title: d.title,
      description: d.description,
      page_url: d.pageUrl?.trim() || null,
      contact_email: d.contactEmail?.trim() || null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      status: "nowe",
    });
    if (error) {
      console.error("[zglos-problem-strony] db", error.message);
    }
  }

  const etykieta = KATEGORIE_ZGLOSZENIA_STRONY.find((k) => k.value === d.category)?.label ?? d.category;
  const doEmail = process.env.KONTAKT_EMAIL?.trim() || "kontakt@naszawies.pl";
  const trescHtml = `
    <p><strong>Kategoria:</strong> ${escapeHtml(etykieta)}</p>
    <p><strong>Tytuł:</strong> ${escapeHtml(d.title)}</p>
    <p><strong>Opis:</strong></p>
    <p>${escapeHtml(d.description).replace(/\n/g, "<br>")}</p>
    ${d.pageUrl ? `<p><strong>Strona:</strong> ${escapeHtml(d.pageUrl)}</p>` : ""}
    ${d.contactEmail ? `<p><strong>Odpowiedź na:</strong> ${escapeHtml(d.contactEmail)}</p>` : ""}
    <p><strong>Użytkownik:</strong> ${user?.id ? escapeHtml(user.id) : "niezalogowany"}</p>
  `;

  const html = htmlSzablonNaszawies({
    siteUrl: siteUrlDlaSzablonuEmail(),
    naglowek: "Zgłoszenie problemu ze stroną",
    trescHtml,
  });

  void wyslijPrzezResend({
    do: doEmail,
    temat: `[Zgłoszenie strony] ${d.title}`,
    trescHtml: html,
    odpowiedzDo: d.contactEmail?.trim() || undefined,
  }).catch((e) => console.warn("[zglos-problem-strony] email", e));

  return NextResponse.json({ ok: true });
}
