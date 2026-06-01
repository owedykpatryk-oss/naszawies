import { headers } from "next/headers";
import { wymagajAkceptacjiPrawnejJesliTrzeba } from "@/app/(site)/panel/akceptacja-regulaminu/akcje-akceptacja";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { sciezkaWymagaAkceptacjiPrawnej } from "@/lib/rodo/bramka-zgod-prawnych";

/** Przekierowuje na akceptację regulaminu, gdy brak aktualnej zgody (np. po logowaniu Google). */
export async function BramkaZgodPrawnych() {
  const h = headers();
  const sciezka = h.get("x-pathname") ?? "/panel";
  if (!sciezkaWymagaAkceptacjiPrawnej(sciezka)) return null;
  const next = bezpiecznaSciezkaNastepna(sciezka);
  await wymagajAkceptacjiPrawnejJesliTrzeba(sciezka, next);
  return null;
}
