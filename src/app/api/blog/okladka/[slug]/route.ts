import { NextRequest, NextResponse } from "next/server";
import { pobierzArtykulPoSlug } from "@/lib/blog/wczytaj-tresci";
import { createCoverImageBuffer } from "@/lib/images/create-cover-image";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const artykul = pobierzArtykulPoSlug(params.slug);
  const tytul = artykul?.title ?? "naszawies.pl";
  const buf = await createCoverImageBuffer(tytul);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
