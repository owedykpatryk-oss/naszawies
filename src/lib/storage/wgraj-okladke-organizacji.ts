"use server";

import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { R2_BUCKET_VILLAGE_PHOTOS } from "@/lib/cloudflare/r2-bucket-znaczniki";
import { czyPelnaKonfiguracjaR2S3 } from "@/lib/cloudflare/r2-env";
import { wgrajBuforDoR2 } from "@/lib/cloudflare/r2-s3-klient";
import { zbudujPublicznyUrlObiektuR2 } from "@/lib/cloudflare/r2-url-pomoc";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { przyciajObrazDoOkladki16x9 } from "@/lib/storage/przyciaj-obraz-okladki";
import { czyBuforZgodnyZMimeObrazu } from "@/lib/storage/waliduj-magic-bytes-obrazu";
import type { WynikWgrajR2 } from "@/lib/storage/wgraj-obraz-r2";

const uuid = z.string().uuid();
const MIME_OBRAZ = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_ROZMIAR = 3 * 1024 * 1024;

function czySerwerMozeWgrywacNaR2(): boolean {
  if (!czyPelnaKonfiguracjaR2S3()) return false;
  return zbudujPublicznyUrlObiektuR2(R2_BUCKET_VILLAGE_PHOTOS, "test") != null;
}

/** Wgrywa okładkę mini-strony organizacji — zawsze przez serwer, z przycięciem 16:9. */
export async function wgrajOkladkeOrganizacji(formData: FormData): Promise<WynikWgrajR2> {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const villageId = String(formData.get("villageId") ?? "");
  if (!uuid.safeParse(villageId).success) return { blad: "Niepoprawna wieś." };

  const vidsSoltys = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vidsSoltys.includes(villageId)) {
    return { blad: "Tylko sołtys może wgrywać okładkę organizacji." };
  }

  const plik = formData.get("file");
  if (!(plik instanceof File) || plik.size < 1) return { blad: "Brak pliku." };
  if (!MIME_OBRAZ.has(plik.type)) return { blad: "Dozwolone: JPEG, PNG, WebP." };
  if (plik.size > MAX_ROZMIAR) return { blad: "Maksymalnie 3 MB." };

  const surowy = Buffer.from(await plik.arrayBuffer());
  if (!czyBuforZgodnyZMimeObrazu(surowy, plik.type)) {
    return { blad: "Nieprawidłowy format pliku (JPEG, PNG lub WebP)." };
  }

  const przetworzony = await przyciajObrazDoOkladki16x9(surowy, plik.type);
  const buforWgrywki = Buffer.from(przetworzony.buf);
  const mimeWgrywki = przetworzony.mime;
  const ext = przetworzony.rozszerzenie;
  const klucz = `${villageId}/organizacje/${crypto.randomUUID()}.${ext}`;

  if (czySerwerMozeWgrywacNaR2()) {
    const w = await wgrajBuforDoR2(R2_BUCKET_VILLAGE_PHOTOS, klucz, buforWgrywki, mimeWgrywki);
    if (!w.ok) return { blad: w.blad };
    const publicUrl = zbudujPublicznyUrlObiektuR2(R2_BUCKET_VILLAGE_PHOTOS, klucz);
    if (!publicUrl) return { blad: "Nie udało się zbudować publicznego adresu pliku." };
    return { ok: true, publicUrl };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const { error } = await supabase.storage.from("village_photos").upload(klucz, buforWgrywki, {
    upsert: false,
    contentType: mimeWgrywki,
  });
  if (error) {
    return { blad: "Nie udało się wgrać zdjęcia. Możesz wkleić adres URL ręcznie." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("village_photos").getPublicUrl(klucz);
  return { ok: true, publicUrl };
}
