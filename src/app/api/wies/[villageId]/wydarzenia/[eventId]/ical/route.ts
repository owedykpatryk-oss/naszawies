import { NextResponse } from "next/server";
import { utworzPlikIcs } from "@/lib/kalendarz/utworz-plik-ics";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type Params = { params: { villageId: string; eventId: string } };

export async function GET(_req: Request, { params }: Params) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Brak konfiguracji" }, { status: 503 });
  }

  const { data: ev } = await supabase
    .from("village_community_events")
    .select("id, title, description, location_text, starts_at, ends_at, village_id")
    .eq("id", params.eventId)
    .eq("village_id", params.villageId)
    .eq("status", "approved")
    .maybeSingle();

  if (!ev) {
    return NextResponse.json({ blad: "Nie znaleziono wydarzenia" }, { status: 404 });
  }

  const start = new Date(ev.starts_at);
  const end = ev.ends_at ? new Date(ev.ends_at) : null;
  const ics = utworzPlikIcs({
    uid: `community-event-${ev.id}`,
    title: ev.title,
    description: ev.description,
    location: ev.location_text,
    startAt: start,
    endAt: end,
    url: `https://naszawies.pl`,
  });

  const safeName = ev.title.replace(/[^\w\s-]/g, "").slice(0, 60).trim() || "wydarzenie";

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
