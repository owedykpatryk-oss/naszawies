import { NextResponse } from "next/server";

/** RFC 9116 — kontakt ds. bezpieczeństwa. */
export function GET() {
  const body = [
    "Contact: mailto:kontakt@naszawies.pl",
    "Contact: mailto:moderacja@naszawies.pl",
    "Preferred-Languages: pl, en",
    "Canonical: https://naszawies.pl/.well-known/security.txt",
    "Policy: https://naszawies.pl/regulamin",
    "Policy: https://naszawies.pl/polityka-prywatnosci",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
