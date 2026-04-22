import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const bodySchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(200),
  villageName: z.string().min(2).max(200),
  commune: z.string().min(2).max(200),
  role: z.enum(["soltys", "mieszkaniec"]),
});

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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Uzupełnij poprawnie wszystkie pola formularza." },
      { status: 400 }
    );
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
  const { error } = await supabase.from("waitlist").insert({
    email: parsed.data.email.toLowerCase(),
    full_name: parsed.data.fullName,
    village_name: parsed.data.villageName,
    commune: parsed.data.commune,
    role: parsed.data.role,
    source: "landing",
    consent_text_version: "landing-v0",
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
