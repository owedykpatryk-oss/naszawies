"use server";

import { z } from "zod";
import {
  R2_BUCKET_AVATARS,
  R2_BUCKET_BOOKING_DAMAGE,
  R2_BUCKET_HALL_INVENTORY,
} from "@/lib/cloudflare/r2-bucket-znaczniki";
import { czyPelnaKonfiguracjaR2S3 } from "@/lib/cloudflare/r2-env";
import { wgrajBuforDoR2 } from "@/lib/cloudflare/r2-s3-klient";
import { zbudujPublicznyUrlObiektuR2 } from "@/lib/cloudflare/r2-url-pomoc";
import { usunObiektR2JesliUrlNasz } from "@/lib/storage/usun-plik-r2-po-url";
import {
  czyUzytkownikJestSoltysemDlaSali,
  pobierzVillageIdsRoliPaneluSoltysa,
} from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();
const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type WynikWgrajR2 = { ok: true; publicUrl: string } | { blad: string };

function czySerwerMozeWgrywacNaR2(): boolean {
  if (!czyPelnaKonfiguracjaR2S3()) return false;
  return zbudujPublicznyUrlObiektuR2(R2_BUCKET_AVATARS, "test") != null;
}

function czySoltysLubWspoladminSwietlicy(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  userId: string,
  hallId: string
): Promise<boolean> {
  return czyUzytkownikJestSoltysemDlaSali(supabase, userId, hallId);
}

type WierszRezerwacjiZniszczenia = { hall_id: string; urls: string[] };

async function pobierzRezerwacjeDoDokumentacjiZniszczen(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  bookingId: string,
  userId: string
): Promise<WierszRezerwacjiZniszczenia | null> {
  const { data: b, error } = await supabase
    .from("hall_bookings")
    .select("id, hall_id, booked_by, status, damage_documentation_urls, halls!inner(village_id)")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !b || !["approved", "completed"].includes(b.status)) {
    return null;
  }

  const halls = b.halls as { village_id: string } | { village_id: string }[] | null;
  const wiesId = Array.isArray(halls) ? halls[0]?.village_id : halls?.village_id;
  if (!wiesId) return null;

  const jestWynajmujacym = b.booked_by === userId;
  let jestSoltysem = false;
  if (!jestWynajmujacym) {
    const villageIds = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
    jestSoltysem = villageIds.includes(wiesId);
  }

  if (!jestWynajmujacym && !jestSoltysem) {
    return null;
  }

  const urls = Array.isArray(b.damage_documentation_urls) ? (b.damage_documentation_urls as string[]) : [];
  return { hall_id: b.hall_id, urls };
}

/**
 * Wgrywa obraz do R2 (serwer). Klient wywołuje tylko gdy `czyKlientUzywaMagazynuR2()`.
 */
export async function wgrajObrazDoMagazynuR2(formData: FormData): Promise<WynikWgrajR2> {
  if (!czySerwerMozeWgrywacNaR2()) {
    return { blad: "Zapisywanie plików jest chwilowo niedostępne. Spróbuj później." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const typ = String(formData.get("typ") ?? "");
  const plik = formData.get("file");
  if (!(plik instanceof File) || plik.size < 1) {
    return { blad: "Brak pliku." };
  }
  if (!MIME.has(plik.type)) {
    return { blad: "Dozwolone: JPEG, PNG, WebP." };
  }

  const buf = Buffer.from(await plik.arrayBuffer());

  if (typ === "avatar") {
    if (buf.length > 2 * 1024 * 1024) {
      return { blad: "Maksymalny rozmiar pliku to 2 MB." };
    }
    const rozszerzenie = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
    const klucz = `${user.id}/avatar-${Date.now()}.${rozszerzenie}`;
    const w = await wgrajBuforDoR2(R2_BUCKET_AVATARS, klucz, buf, plik.type);
    if (!w.ok) return { blad: w.blad };
    const publicUrl = zbudujPublicznyUrlObiektuR2(R2_BUCKET_AVATARS, klucz);
    if (!publicUrl) return { blad: "Nie udało się zbudować publicznego adresu pliku." };
    return { ok: true, publicUrl };
  }

  if (typ === "inventory") {
    if (buf.length > 3 * 1024 * 1024) {
      return { blad: "Maksymalnie 3 MB." };
    }
    const hallId = String(formData.get("hallId") ?? "");
    const pozycjaId = String(formData.get("pozycjaId") ?? "");
    if (!uuid.safeParse(hallId).success || !uuid.safeParse(pozycjaId).success) {
      return { blad: "Niepoprawny identyfikator sali lub pozycji." };
    }
    const moze = await czySoltysLubWspoladminSwietlicy(supabase, user.id, hallId);
    if (!moze) {
      return { blad: "Brak uprawnień do zdjęcia wyposażenia tej świetlicy." };
    }
    const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
    const klucz = `${hallId}/${pozycjaId}-${Date.now()}.${ext}`;
    const w = await wgrajBuforDoR2(R2_BUCKET_HALL_INVENTORY, klucz, buf, plik.type);
    if (!w.ok) return { blad: w.blad };
    const publicUrl = zbudujPublicznyUrlObiektuR2(R2_BUCKET_HALL_INVENTORY, klucz);
    if (!publicUrl) return { blad: "Nie udało się zbudować publicznego adresu pliku." };
    return { ok: true, publicUrl };
  }

  if (typ === "damage") {
    if (buf.length > 3 * 1024 * 1024) {
      return { blad: "Maksymalnie 3 MB." };
    }
    const bookingId = String(formData.get("bookingId") ?? "");
    if (!uuid.safeParse(bookingId).success) {
      return { blad: "Niepoprawny identyfikator rezerwacji." };
    }
    const wiersz = await pobierzRezerwacjeDoDokumentacjiZniszczen(supabase, bookingId, user.id);
    if (!wiersz) {
      return { blad: "Brak uprawnień lub rezerwacja nie pozwala na dokumentację." };
    }
    const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
    const klucz = `${bookingId}/${Date.now()}.${ext}`;
    const w = await wgrajBuforDoR2(R2_BUCKET_BOOKING_DAMAGE, klucz, buf, plik.type);
    if (!w.ok) return { blad: w.blad };
    const publicUrl = zbudujPublicznyUrlObiektuR2(R2_BUCKET_BOOKING_DAMAGE, klucz);
    if (!publicUrl) return { blad: "Nie udało się zbudować publicznego adresu pliku." };
    return { ok: true, publicUrl };
  }

  return { blad: "Nieobsługiwany typ wgrywki." };
}

/** Gdy zapis URL w bazie się nie udał — usuń obiekt z R2 (bez błędu dla innych hostów). */
export async function cofnijWgranyPlikR2(publicUrl: string): Promise<void> {
  await usunObiektR2JesliUrlNasz(publicUrl);
}
