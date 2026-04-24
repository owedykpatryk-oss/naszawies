"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { wyciagnijBucketIKluczZUrlaR2 } from "@/lib/cloudflare/r2-url-pomoc";
import { usunObiektR2JesliUrlNasz } from "@/lib/storage/usun-plik-r2-po-url";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const schemat = z.object({
  display_name: z.string().trim().min(1, "Podaj nazwę wyświetlaną.").max(80),
  bio: z.string().trim().max(500),
  phone: z.string().trim().max(30),
  phone_visible_public: z.boolean(),
});

function naNullPusty(s: string): string | null {
  return s.length === 0 ? null : s;
}

export type WynikAkcjiProfilu = { blad: string } | { ok: true };

export async function aktualizujProfilZFormularza(formData: FormData): Promise<WynikAkcjiProfilu> {
  const surowe = {
    display_name: String(formData.get("display_name") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    phone_visible_public: formData.get("phone_visible_public") === "true",
  };

  const sparsowane = schemat.safeParse(surowe);
  if (!sparsowane.success) {
    const pierwszy = sparsowane.error.issues[0]?.message ?? "Niepoprawne dane.";
    return { blad: pierwszy };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Brak sesji — zaloguj się ponownie." };
  }

  const { data: cur } = await supabase.from("users").select("avatar_url").eq("id", user.id).maybeSingle();

  const wiersz = {
    id: user.id,
    display_name: sparsowane.data.display_name,
    bio: naNullPusty(sparsowane.data.bio),
    phone: naNullPusty(sparsowane.data.phone),
    phone_visible_public: sparsowane.data.phone_visible_public,
    avatar_url: cur?.avatar_url ?? null,
  };

  const { error } = await supabase.from("users").upsert(wiersz, { onConflict: "id" });

  if (error) {
    console.error("[aktualizujProfil]", error.message);
    return { blad: "Nie udało się zapisać profilu. Spróbuj ponownie." };
  }

  revalidatePath("/panel");
  revalidatePath("/panel/profil");
  revalidatePath(`/u/${user.id}`);
  return { ok: true };
}

/** URL z publicznego bucketa `avatars` (Supabase lub R2) po uploadzie. */
export async function aktualizujAvatarZWeryfikowanegoUrl(publicUrl: string): Promise<WynikAkcjiProfilu> {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Brak sesji." };
  }

  const baza = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const prefixSupa = baza ? `${baza}/storage/v1/object/public/avatars/` : null;
  const r2 = wyciagnijBucketIKluczZUrlaR2(publicUrl);

  if (prefixSupa && publicUrl.startsWith(prefixSupa)) {
    const sciezka = publicUrl.slice(prefixSupa.length);
    if (!sciezka.startsWith(`${user.id}/`)) {
      return { blad: "Nieprawidłowa ścieżka pliku." };
    }
  } else if (r2?.bucket === "avatars" && r2.key.startsWith(`${user.id}/`)) {
    /* ok — R2 */
  } else {
    return { blad: "Adres awatara musi pochodzić z magazynu plików naszej strony." };
  }

  const { error } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", user.id);
  if (error) {
    console.error("[aktualizujAvatar]", error.message);
    return { blad: "Nie udało się zapisać awatara." };
  }

  revalidatePath("/panel/profil");
  revalidatePath(`/u/${user.id}`);
  return { ok: true };
}

export async function usunAvatar(): Promise<WynikAkcjiProfilu> {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Brak sesji." };
  }

  const { data: cur } = await supabase.from("users").select("avatar_url").eq("id", user.id).maybeSingle();
  const stary = cur?.avatar_url ?? null;
  if (stary) {
    await usunObiektR2JesliUrlNasz(stary);
    const baza = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const prefix = baza ? `${baza}/storage/v1/object/public/avatars/` : null;
    if (prefix && stary.startsWith(prefix)) {
      const sciezka = stary.slice(prefix.length);
      const { error: rmErr } = await supabase.storage.from("avatars").remove([sciezka]);
      if (rmErr) console.warn("[usunAvatar] Supabase Storage:", rmErr.message);
    }
  }

  const { error } = await supabase.from("users").update({ avatar_url: null }).eq("id", user.id);
  if (error) {
    return { blad: "Nie udało się usunąć awatara." };
  }
  revalidatePath("/panel/profil");
  revalidatePath(`/u/${user.id}`);
  return { ok: true };
}
