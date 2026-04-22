import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const trescZapytania = z
  .object({
    email: z.string().email("Podaj poprawny adres e-mail."),
    fullName: z.string().min(2).max(200),
    villageName: z.string().min(2).max(200),
    commune: z.string().min(2).max(200),
    role: z.enum(["soltys", "mieszkaniec"]),
    rodoZaakceptowane: z
      .boolean()
      .refine((v) => v === true, {
        message: "Wymagana jest zgoda na przetwarzanie danych.",
      }),
    bottrap: z.string().optional(),
  })
  .strict()
  .superRefine((dane, ctx) => {
    if (dane.bottrap && dane.bottrap.trim() !== "") {
      ctx.addIssue({
        code: "custom",
        message: "Odrzucono zgłoszenie.",
        path: ["bottrap"],
      });
    }
  });

function odczytajAdresIp(naglowki: Headers): string | null {
  const xff = naglowki.get("x-forwarded-for");
  if (xff) {
    const pierwszy = xff.split(",")[0]?.trim();
    if (pierwszy) return pierwszy;
  }
  const realIp = naglowki.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return null;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Niepoprawny format żądania." },
      { status: 400 }
    );
  }

  const sparsowane = trescZapytania.safeParse(json);
  if (!sparsowane.success) {
    const pierwszyBlad = sparsowane.error.issues[0];
    const komunikat =
      pierwszyBlad?.message ||
      "Uzupełnij poprawnie wszystkie pola formularza.";
    return NextResponse.json({ error: komunikat }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Zapis na listę będzie aktywny po podłączeniu bazy. Tymczasem napisz na kontakt@naszawies.pl.",
      },
      { status: 503 }
    );
  }

  const dane = sparsowane.data;
  const adresIp = odczytajAdresIp(request.headers);

  const { error } = await supabase.from("waitlist").insert({
    email: dane.email.toLowerCase(),
    full_name: dane.fullName,
    village_name: dane.villageName,
    commune: dane.commune,
    role: dane.role,
    source: "landing",
    consent_text_version: "landing-v1-zgoda-checkbox",
    ip_address: adresIp,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ten adres e-mail jest już na liście." },
        { status: 409 }
      );
    }
    console.error("[waitlist]", error.message);
    return NextResponse.json(
      { error: "Nie udało się zapisać. Spróbuj ponownie za chwilę." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
