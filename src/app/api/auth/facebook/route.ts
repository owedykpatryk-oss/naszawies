import { NextRequest } from "next/server";
import { rozpocznijLogowanieOAuth } from "@/lib/auth/rozpocznij-logowanie-oauth";

/** Facebook OAuth — po walidacji Turnstile zwraca URL przekierowania. */
export async function POST(request: NextRequest) {
  return rozpocznijLogowanieOAuth(request, "facebook");
}
