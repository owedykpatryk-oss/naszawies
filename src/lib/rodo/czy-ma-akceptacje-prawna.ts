import { AKTUALNY_BUNDLE_WERSJI_PRAWNYCH } from "@/lib/rodo/wersje-dokumentow";

export function czyProfilMaAktualnaAkceptacjePrawna(profil: {
  legal_accepted_at?: string | null;
  legal_bundle_version?: string | null;
} | null): boolean {
  if (!profil?.legal_accepted_at || !profil.legal_bundle_version) return false;
  return profil.legal_bundle_version === AKTUALNY_BUNDLE_WERSJI_PRAWNYCH;
}
