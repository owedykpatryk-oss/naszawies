import { finalizujPowiazanieZRejestracji } from "@/lib/auth/finalizuj-powiazanie-z-rejestracji";

/** Jednorazowo po logowaniu: wniosek mieszkańca / sołtysa z metadanych rejestracji. */
export async function FinalizujPowiazanieRejestracji() {
  await finalizujPowiazanieZRejestracji();
  return null;
}
