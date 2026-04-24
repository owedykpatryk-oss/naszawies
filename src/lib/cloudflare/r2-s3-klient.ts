import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { pobierzKonfiguracjeR2S3 } from "./r2-env";
import { zbudujPublicznyUrlObiektuR2 } from "./r2-url-pomoc";

let klientCache: S3Client | null = null;

/** Klient S3 zgodny z Cloudflare R2 (jedna instancja na proces). */
export function utworzKlientaR2S3(): S3Client | null {
  const cfg = pobierzKonfiguracjeR2S3();
  if (!cfg) return null;
  if (!klientCache) {
    klientCache = new S3Client({
      region: "auto",
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return klientCache;
}

export async function wgrajBuforDoR2(
  bucket: string,
  klucz: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ ok: true } | { ok: false; blad: string }> {
  const client = utworzKlientaR2S3();
  if (!client) {
    return { ok: false, blad: "Brak konfiguracji R2 (CLOUDFLARE_R2_* w .env)." };
  }
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: klucz,
        Body: body,
        ContentType: contentType,
      })
    );
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, blad: msg };
  }
}

export async function usunObiektR2(bucket: string, klucz: string): Promise<{ ok: true } | { ok: false; blad: string }> {
  const client = utworzKlientaR2S3();
  if (!client) {
    return { ok: false, blad: "Brak konfiguracji R2." };
  }
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: klucz }));
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, blad: msg };
  }
}

/** Presigned PUT (np. upload z przeglądarki bez serwera pośredniego). */
export async function podpisanyUrlPutR2(
  bucket: string,
  klucz: string,
  contentType: string,
  wygasaSek = 3600
): Promise<{ ok: true; url: string } | { ok: false; blad: string }> {
  const client = utworzKlientaR2S3();
  if (!client) {
    return { ok: false, blad: "Brak konfiguracji R2." };
  }
  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: klucz,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, cmd, { expiresIn: wygasaSek });
    return { ok: true, url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, blad: msg };
  }
}

/** Publiczny URL obiektu — patrz `zbudujPublicznyUrlObiektuR2`. */
export function publicznyUrlObiektuR2(bucket: string, klucz: string): string | null {
  return zbudujPublicznyUrlObiektuR2(bucket, klucz);
}
