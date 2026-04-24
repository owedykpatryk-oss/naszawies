import { usunObiektR2 } from "@/lib/cloudflare/r2-s3-klient";
import { wyciagnijBucketIKluczZUrlaR2 } from "@/lib/cloudflare/r2-url-pomoc";

/** Usuwa obiekt z R2, jeśli URL pochodzi z naszej konfiguracji publicznej. */
export async function usunObiektR2JesliUrlNasz(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl?.trim()) return;
  const parsed = wyciagnijBucketIKluczZUrlaR2(publicUrl.trim());
  if (!parsed) return;
  const w = await usunObiektR2(parsed.bucket, parsed.key);
  if (!w.ok) {
    console.warn("[usunObiektR2JesliUrlNasz]", w.blad, publicUrl.slice(0, 80));
  }
}
