import { NextResponse } from "next/server";
import { pobierzCeneGruntuWoj } from "@/lib/gus/pobierz-dane-gus-wies";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wojewodztwo = url.searchParams.get("wojewodztwo")?.trim();
  if (!wojewodztwo) {
    return NextResponse.json({ blad: "Brak parametru wojewodztwo." }, { status: 400 });
  }

  const cena = await pobierzCeneGruntuWoj(wojewodztwo);
  return NextResponse.json(
    { cena },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
