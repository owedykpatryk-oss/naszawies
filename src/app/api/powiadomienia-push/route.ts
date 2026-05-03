import { NextResponse } from "next/server";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const dynamic = "force-dynamic";

const zapisz = z.object({
  rodzaj: z.literal("zapisz"),
  endpoint: z.string().min(12).max(4096),
  keys: z.object({
    p256dh: z.string().min(16).max(2000),
    auth: z.string().min(8).max(500),
  }),
});

const usun = z.object({
  rodzaj: z.literal("usun"),
  endpoint: z.string().min(12).max(4096),
});

const cialo = z.discriminatedUnion("rodzaj", [zapisz, usun]);

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ blad: "Niepoprawne JSON." }, { status: 400 });
  }

  const parsed = cialo.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ blad: "Sprawdź dane subskrypcji." }, { status: 400 });
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ blad: "Zaloguj się." }, { status: 401 });
  }

  if (parsed.data.rodzaj === "usun") {
    const { error } = await supabase
      .from("user_web_push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", parsed.data.endpoint);
    if (error) {
      console.error("[powiadomienia-push usun]", error.message);
      return NextResponse.json({ blad: "Nie udało się usunąć subskrypcji." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("user_web_push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      keys_p256dh: parsed.data.keys.p256dh,
      keys_auth: parsed.data.keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    console.error("[powiadomienia-push zapisz]", error.message);
    return NextResponse.json({ blad: "Nie udało się zapisać subskrypcji (czy migracja bazy jest zastosowana?)." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
