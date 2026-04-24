/**
 * Zmienne środowiskowe Cloudflare R2 (S3-compatible endpoint).
 * Używane przez `r2-s3-klient` — upload można stopniowo przenieść z Supabase Storage.
 */
export type KonfiguracjaR2 = {
  accountId: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** np. https://cdn.twoja-domena.pl — bez końcowego / */
  publicBaseUrl: string | null;
};

export function czyPelnaKonfiguracjaR2S3(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_R2_ENDPOINT?.trim() &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim()
  );
}

export function pobierzKonfiguracjeR2S3(): KonfiguracjaR2 | null {
  if (!czyPelnaKonfiguracjaR2S3()) return null;
  const accountId =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim() ||
    wyciagnijAccountIdZEndpointu(process.env.CLOUDFLARE_R2_ENDPOINT ?? "");
  return {
    accountId,
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!.replace(/\/$/, ""),
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    publicBaseUrl:
      process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      null,
  };
}

/** Endpoint Cloudflare ma postać https://&lt;account_id&gt;.r2.cloudflarestorage.com */
function wyciagnijAccountIdZEndpointu(endpoint: string): string {
  try {
    const u = new URL(endpoint);
    const host = u.hostname;
    const m = host.match(/^([a-f0-9]{32})\.r2\.cloudflarestorage\.com$/i);
    return m?.[1] ?? "";
  } catch {
    return "";
  }
}
