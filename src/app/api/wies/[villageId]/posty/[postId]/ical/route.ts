import { NextResponse } from "next/server";
import { utworzPlikIcs } from "@/lib/kalendarz/utworz-plik-ics";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type Params = { params: { villageId: string; postId: string } };

export async function GET(_req: Request, { params }: Params) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Brak konfiguracji" }, { status: 503 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, body, event_start_at, event_end_at, event_location, type, village_id")
    .eq("id", params.postId)
    .eq("village_id", params.villageId)
    .eq("status", "approved")
    .in("type", ["wydarzenie", "zebranie"])
    .maybeSingle();

  if (!post?.event_start_at) {
    return NextResponse.json({ blad: "Post nie jest wydarzeniem z datą" }, { status: 404 });
  }

  const start = new Date(post.event_start_at);
  const end = post.event_end_at ? new Date(post.event_end_at) : null;
  const ics = utworzPlikIcs({
    uid: `post-event-${post.id}`,
    title: post.title,
    description: post.body,
    location: post.event_location,
    startAt: start,
    endAt: end,
  });

  const safeName = post.title.replace(/[^\w\s-]/g, "").slice(0, 60).trim() || "wydarzenie";

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
