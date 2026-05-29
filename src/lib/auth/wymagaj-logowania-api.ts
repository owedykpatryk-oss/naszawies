import { NextResponse } from "next/server";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";

export type WynikAuthApi = { ok: true } | { ok: false; response: NextResponse };

export async function wymagajLogowaniaApi(): Promise<WynikAuthApi> {
  const user = await pobierzUzytkownikaSerwer();
  if (user) return { ok: true };
  return {
    ok: false,
    response: NextResponse.json(
      { blad: "Ta funkcja jest dostępna po zalogowaniu." },
      { status: 401 },
    ),
  };
}
