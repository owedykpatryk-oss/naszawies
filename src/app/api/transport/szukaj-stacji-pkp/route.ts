import { NextResponse } from "next/server";
import { z } from "zod";
import { ipZRequestu, sprawdzLimitApi } from "@/lib/rate-limit/sprawdz-limit-upstash";
import { wyszukajStacjePkpPoNazwie } from "@/lib/transport/pkp-plk-api";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const schema = z.object({
  q: z.string().trim().min(2).max(80),
});

export async function GET(request: Request) {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) {
    return NextResponse.json({ stacje: [], blad: "Zaloguj się, aby wyszukiwać stacje PKP." }, { status: 401 });
  }

  const limit = await sprawdzLimitApi("transport_pkp_szukaj", `${user.id}:${ipZRequestu(request.headers)}`);
  if (!limit.ok) {
    return NextResponse.json(
      { stacje: [], blad: `Za dużo zapytań. Spróbuj za ${limit.retryPoSekundach} s.` },
      { status: 429 },
    );
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const parsed = schema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json({ stacje: [], blad: "Podaj co najmniej 2 znaki." }, { status: 400 });
  }

  try {
    const stacje = await wyszukajStacjePkpPoNazwie(parsed.data.q);
    return NextResponse.json({ stacje: stacje.slice(0, 12) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Błąd wyszukiwarki PKP.";
    return NextResponse.json({ stacje: [], blad: msg }, { status: 503 });
  }
}
