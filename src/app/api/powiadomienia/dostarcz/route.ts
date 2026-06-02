import { NextRequest, NextResponse } from "next/server";
import { czyZapytanieCronAutoryzowane } from "@/lib/api/autoryzacja-cron";
import { pobierzIpIUserAgentZRequestu, zapiszCronRun } from "@/lib/api/zapisz-cron-run";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { zaplanujPowiadomienieEmail } from "@/lib/email/zaplanuj-powiadomienie-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ZadanieDigest = {
  id: string;
  user_id: string;
  kanal: "push" | "email" | "sms";
  czestotliwosc: string;
  notification_id: string | null;
  notifications: {
    title: string;
    body: string;
    link_url: string | null;
    type: string;
  } | null;
};

/** Cron co 5 min — dostarcza powiadomienia z kolejki digest (push, e-mail). */
export async function GET(req: NextRequest) {
  const endpoint = "/api/powiadomienia/dostarcz";
  const startedAt = new Date().toISOString();
  const meta = pobierzIpIUserAgentZRequestu(req);

  if (!czyZapytanieCronAutoryzowane(req)) {
    return NextResponse.json({ blad: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ blad: "Brak konfiguracji serwera." }, { status: 503 });
  }

  const teraz = new Date().toISOString();
  const { data: zadaniaRaw, error } = await admin
    .from("notification_digest_queue")
    .select("id, user_id, kanal, czestotliwosc, notification_id, notifications(title, body, link_url, type)")
    .is("wyslane_at", null)
    .lte("zaplanowane_na", teraz)
    .order("zaplanowane_na", { ascending: true })
    .limit(80);

  if (error) {
    await zapiszCronRun(admin, {
      endpoint,
      status: "error",
      started_at: startedAt,
      error_message: error.message,
      ...meta,
    });
    return NextResponse.json({ blad: error.message }, { status: 500 });
  }

  const zadania = (zadaniaRaw ?? []) as unknown as ZadanieDigest[];
  let sukces = 0;
  let bledy = 0;

  for (const z of zadania) {
    const notif = z.notifications;
    try {
      if (z.kanal === "push" && notif) {
        await wyslijWebPushDlaUzytkownika(admin, {
          userId: z.user_id,
          title: notif.title,
          body: notif.body,
          linkUrl: notif.link_url,
          tag: notif.type,
        });
      } else if (z.kanal === "email" && notif) {
        zaplanujPowiadomienieEmail(z.user_id, notif.title, notif.title, [notif.body]);
      }
      await admin
        .from("notification_digest_queue")
        .update({ wyslane_at: new Date().toISOString() })
        .eq("id", z.id);
      sukces += 1;
    } catch (e) {
      bledy += 1;
      const msg = e instanceof Error ? e.message : String(e);
      await admin.from("notification_digest_queue").update({ blad: msg.slice(0, 500) }).eq("id", z.id);
    }
  }

  await zapiszCronRun(admin, {
    endpoint,
    status: bledy > 0 && sukces === 0 ? "error" : "success",
    started_at: startedAt,
    affected_rows: { processed: zadania.length, success: sukces, errors: bledy },
    ...meta,
  });

  return NextResponse.json({ ok: true, processed: zadania.length, success: sukces, errors: bledy });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
