import { NextResponse } from "next/server";
import { z } from "zod";
import { odczytajAdresIpZNaglowkow } from "@/lib/api/odczytaj-adres-ip";
import { siteUrlDlaSzablonuEmail } from "@/lib/email/szablon-html-naszawies";
import { AKTUALNY_BUNDLE_WERSJI_PRAWNYCH } from "@/lib/rodo/wersje-dokumentow";
import {
  czyPodejrzanyEmailDotStuffing,
  walidujWyswietlanaNazwaRejestracji,
} from "@/lib/rejestracja/waliduj-wyswietlana-nazwa";
import { sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { walidujTurnstileZNaglowkow } from "@/lib/turnstile/waliduj-token-serwer";

const intencjaSchema = z.enum(["mieszkaniec", "soltys", "inne", "nie_podano"]);

const tresc = z
  .object({
    email: z.string().email().max(320),
    haslo: z.string().min(8).max(128),
    wyswietlanaNazwa: z.string().min(2).max(80),
    intencja: intencjaSchema,
    signupVillageId: z.string().max(40).optional(),
    signupVillageLabel: z.string().max(500).optional(),
    signupVillageTeryt: z.string().max(32).optional(),
    nastepnaSciezka: z.string().max(500).optional(),
    cfTurnstileResponse: z.string().max(4096).optional(),
    bottrap: z.string().optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.bottrap && d.bottrap.trim() !== "") {
      ctx.addIssue({ code: "custom", message: "Odrzucono.", path: ["bottrap"] });
    }
  });

function bezpiecznaSciezkaNastepna(raw: string | undefined): string {
  const s = (raw ?? "/panel").trim();
  if (!s.startsWith("/") || s.startsWith("//")) return "/panel";
  return s.slice(0, 500);
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
    const msg = sparsowane.error.issues[0]?.message || "Sprawdź pola formularza.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const d = sparsowane.data;

  const turnstile = await walidujTurnstileZNaglowkow(d.cfTurnstileResponse, request.headers);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.komunikat }, { status: 400 });
  }

  const ip = odczytajAdresIpZNaglowkow(request.headers);
  const limit = await sprawdzLimitApi("rejestracja", ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Zbyt wiele prób rejestracji z tego adresu. Spróbuj ponownie później." },
      { status: 429 },
    );
  }

  const email = d.email.trim().toLowerCase();
  if (czyPodejrzanyEmailDotStuffing(email)) {
    return NextResponse.json(
      { error: "Ten adres e-mail wygląda na automatyczny. Użyj zwykłego adresu Gmail lub innej skrzynki." },
      { status: 400 },
    );
  }

  const nazwaW = walidujWyswietlanaNazwaRejestracji(d.wyswietlanaNazwa, d.intencja);
  if (!nazwaW.ok) {
    return NextResponse.json({ error: nazwaW.blad }, { status: 400 });
  }

  if ((d.intencja === "mieszkaniec" || d.intencja === "soltys") && !d.signupVillageId?.trim()) {
    return NextResponse.json(
      { error: "Dla wybranej roli wskaż miejscowość z katalogu." },
      { status: 400 },
    );
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Serwis chwilowo niedostępny." }, { status: 503 });
  }

  const pochodzenie = siteUrlDlaSzablonuEmail();
  const nastepna = bezpiecznaSciezkaNastepna(d.nastepnaSciezka);
  const nastepnyPoPotwierdzeniu = encodeURIComponent(nastepna);
  const legalAt = new Date().toISOString();

  const { error } = await supabase.auth.signUp({
    email,
    password: d.haslo,
    options: {
      emailRedirectTo: `${pochodzenie}/auth/potwierdz?next=${nastepnyPoPotwierdzeniu}`,
      data: {
        display_name: nazwaW.nazwa,
        signup_intent: d.intencja,
        signup_village_id: d.signupVillageId?.trim() ?? "",
        signup_village_label: d.signupVillageLabel?.trim() ?? "",
        signup_village_teryt: d.signupVillageTeryt?.trim() ?? "",
        legal_accepted_at: legalAt,
        legal_bundle_version: AKTUALNY_BUNDLE_WERSJI_PRAWNYCH,
      },
    },
  });

  if (error) {
    const msg = error.message.includes("already registered")
      ? "Ten adres jest już zarejestrowany — spróbuj się zalogować."
      : error.message.includes("Password")
        ? "Hasło nie spełnia wymagań bezpieczeństwa."
        : /captcha|timeout-or-duplicate/i.test(error.message)
          ? "Weryfikacja antyspamowa wygasła. Odśwież stronę i spróbuj ponownie."
          : "Nie udało się utworzyć konta. Spróbuj ponownie.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
