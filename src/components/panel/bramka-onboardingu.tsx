import { headers } from "next/headers";
import { wymagajOnboardinguJesliTrzeba } from "@/app/(site)/panel/onboarding/akcje-onboarding";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { sciezkaWymagaOnboardingu } from "@/lib/auth/onboarding-uzytkownika";

/** Przekierowuje nowych użytkowników na wybór wsi przed panelem i mapą. */
export async function BramkaOnboardingu() {
  const h = headers();
  const sciezka = h.get("x-pathname") ?? "/panel";
  if (!sciezkaWymagaOnboardingu(sciezka)) return null;
  const nextRaw = h.get("x-next-onboarding");
  const next = nextRaw ? bezpiecznaSciezkaNastepna(nextRaw) : sciezka;
  await wymagajOnboardinguJesliTrzeba(sciezka, next);
  return null;
}
